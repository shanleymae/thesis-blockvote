import prisma from '../../config/db'
import { getContract } from '../../config/contract'
import { resultsService } from '../results/results.service'

type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
type ElectionScope = 'GLOBAL' | 'ORGANIZATION'

function syncStatusByTime(election: { startDate: Date; endDate: Date }): Exclude<ElectionStatus, 'PAUSED'> {
  const now = new Date()
  const start = new Date(election.startDate)
  const end = new Date(election.endDate)
  if (now < start) return 'UPCOMING'
  if (now > end) return 'CLOSED'
  return 'ACTIVE'
}

function toGroupSummary(group: {
  id: string
  title: string
  description: string
  scope: ElectionScope
  organizationId: string | null
  organization?: { id: string; name: string } | null
  startDate: Date
  endDate: Date
  status: ElectionStatus
  resultsPublished: boolean
  resultsPublishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  elections: Array<{
    id: string
    title: string
    positionTitle: string | null
    positionOrder: number
    contractElectionId: number | null
    candidates?: unknown[]
    _count?: { candidates: number }
  }>
}) {
  const positionCount = group.elections.length
  const candidateCount = group.elections.reduce((sum, election) => {
    if (Array.isArray(election.candidates)) return sum + election.candidates.length
    return sum + (election._count?.candidates ?? 0)
  }, 0)
  const syncedPositionCount = group.elections.filter((election) => election.contractElectionId != null).length

  return {
    id: group.id,
    title: group.title,
    description: group.description,
    scope: group.scope,
    organizationId: group.organizationId,
    organization: group.organization ?? null,
    startDate: group.startDate,
    endDate: group.endDate,
    status: group.status,
    resultsPublished: group.resultsPublished,
    resultsPublishedAt: group.resultsPublishedAt,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    positionCount,
    candidateCount,
    syncedPositionCount,
    positions: group.elections,
  }
}

async function syncGroupStatusInDb(id: string) {
  const group = await prisma.electionGroup.findUnique({ where: { id } })
  if (!group) return
  const derived = syncStatusByTime(group)
  if (derived !== group.status) {
    await prisma.electionGroup.update({ where: { id }, data: { status: derived } })
    await prisma.election.updateMany({ where: { groupId: id }, data: { status: derived } })
  }
}

async function syncGroupListStatuses<
  T extends {
    id: string
    startDate: Date
    endDate: Date
    status: ElectionStatus
  },
>(groups: T[]) {
  const synced = []
  for (const group of groups) {
    const derived = syncStatusByTime(group)
    if (derived !== group.status) {
      await prisma.electionGroup.update({ where: { id: group.id }, data: { status: derived } })
      await prisma.election.updateMany({ where: { groupId: group.id }, data: { status: derived } })
      synced.push({ ...group, status: derived })
    } else {
      synced.push(group)
    }
  }
  return synced
}

async function assertCreateAccess(
  actorId: string,
  data: { scope: ElectionScope; organizationId?: string }
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, organizationId: true, canCreateGlobalElections: true },
  })
  if (!actor) throw new Error('Actor not found')
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') throw new Error('Admin access required')
  if (data.scope === 'GLOBAL' && actor.role !== 'SUPERADMIN' && !actor.canCreateGlobalElections) {
    throw new Error('You are not allowed to create global elections')
  }
  if (data.scope === 'ORGANIZATION' && actor.role === 'ADMIN') {
    if (!actor.organizationId) throw new Error('Admin organization scope is not configured')
    if (data.organizationId !== actor.organizationId) {
      throw new Error('You can only create elections for your assigned organization')
    }
  }
  if (data.scope === 'ORGANIZATION' && !data.organizationId) {
    throw new Error('organizationId is required for organization elections')
  }
  if (data.scope === 'ORGANIZATION' && data.organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: data.organizationId }, select: { id: true } })
    if (!org) throw new Error('Organization not found')
  }
}

async function assertAdminCanReadGroup(userId: string, group: { scope: ElectionScope; organizationId: string | null }) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true, canCreateGlobalElections: true },
  })
  if (!actor) throw new Error('User not found')
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') throw new Error('Admin access required')
  if (actor.role === 'SUPERADMIN') return
  if (group.scope === 'ORGANIZATION' && group.organizationId === actor.organizationId) return
  if (group.scope === 'GLOBAL' && actor.canCreateGlobalElections) return
  throw new Error('You are not allowed to manage this election group')
}

async function createContractElection(data: {
  title: string
  description: string
  startDate: Date
  endDate: Date
}) {
  const contract = getContract()
  if (!contract) throw new Error('Contract not configured on backend')

  const startTs = Math.floor(new Date(data.startDate).getTime() / 1000)
  const endTs = Math.floor(new Date(data.endDate).getTime() / 1000)
  const createElection = contract.getFunction('createElection')
  const tx = await createElection(data.title, data.description, startTs, endTs)
  const receipt = await tx.wait()
  const allLogs = receipt?.logs ?? []
  const contractAddress = (contract.target as string).toLowerCase()
  const ourLogs = allLogs.filter((log: { address?: string }) => String(log?.address ?? '').toLowerCase() === contractAddress)
  const iface = contract.interface
  const logsToTry = ourLogs.length > 0 ? ourLogs : allLogs

  for (const log of logsToTry) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
      if (parsed?.name === 'ElectionCreated') {
        const id = parsed.args.electionId
        const contractElectionId = id != null ? Number(id) : null
        if (contractElectionId != null) return contractElectionId
      }
    } catch {
      // skip logs that do not match our ABI
    }
  }

  throw new Error('Election was not confirmed on-chain. Try again.')
}

export const electionGroupsService = {
  async getList(query: { status?: string; scope?: ElectionScope }) {
    const where: { status?: ElectionStatus; scope?: ElectionScope } = {}
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      where.status = query.status as ElectionStatus
    }
    if (query.scope && ['GLOBAL', 'ORGANIZATION'].includes(query.scope)) where.scope = query.scope

    const groups = await prisma.electionGroup.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        organization: { select: { id: true, name: true } },
        elections: {
          orderBy: { positionOrder: 'asc' },
          include: { _count: { select: { candidates: true } } },
        },
      },
    })

    const synced = await syncGroupListStatuses(groups)
    return synced.map(toGroupSummary)
  },

  async getForVoter(userId: string, query: { status?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })
    if (!user) throw new Error('User not found')
    if (!user.organizationId) throw new Error('User organization not set')

    const where: {
      status?: ElectionStatus
      OR: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }>
    } = {
      OR: [
        { scope: 'GLOBAL' },
        { scope: 'ORGANIZATION', organizationId: user.organizationId },
      ],
    }
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      where.status = query.status as ElectionStatus
    }

    const groups = await prisma.electionGroup.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        organization: { select: { id: true, name: true } },
        elections: {
          orderBy: { positionOrder: 'asc' },
          include: { _count: { select: { candidates: true } } },
        },
      },
    })
    const synced = await syncGroupListStatuses(groups)
    return synced.map(toGroupSummary)
  },

  async getForAdmin(userId: string, query: { status?: string }) {
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true, canCreateGlobalElections: true },
    })
    if (!actor) throw new Error('User not found')
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') throw new Error('Admin access required')

    const where: {
      status?: ElectionStatus
      OR?: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }>
    } = {}
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      where.status = query.status as ElectionStatus
    }
    if (actor.role === 'ADMIN') {
      const orConditions: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }> = []
      if (actor.organizationId) orConditions.push({ scope: 'ORGANIZATION', organizationId: actor.organizationId })
      if (actor.canCreateGlobalElections) orConditions.push({ scope: 'GLOBAL' })
      where.OR = orConditions
    }

    const groups = await prisma.electionGroup.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        organization: { select: { id: true, name: true } },
        elections: {
          orderBy: { positionOrder: 'asc' },
          include: { _count: { select: { candidates: true } } },
        },
      },
    })
    const synced = await syncGroupListStatuses(groups)
    return synced.map(toGroupSummary)
  },

  async getById(id: string) {
    await syncGroupStatusInDb(id)
    const group = await prisma.electionGroup.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        elections: {
          orderBy: { positionOrder: 'asc' },
          include: {
            candidates: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })
    if (!group) throw new Error('Election group not found')
    return toGroupSummary(group)
  },

  async getByIdForAdmin(id: string, userId: string) {
    const group = await prisma.electionGroup.findUnique({
      where: { id },
      select: { scope: true, organizationId: true },
    })
    if (!group) throw new Error('Election group not found')
    await assertAdminCanReadGroup(userId, group)
    return this.getById(id)
  },

  async create(
    actorId: string,
    data: {
      title: string
      description: string
      startDate: Date
      endDate: Date
      scope: ElectionScope
      organizationId?: string
      positions: string[]
    }
  ) {
    const positions = data.positions.map((position) => position.trim()).filter(Boolean)
    if (positions.length === 0) throw new Error('At least one position is required')
    if (new Set(positions.map((position) => position.toLowerCase())).size !== positions.length) {
      throw new Error('Position names must be unique')
    }

    await assertCreateAccess(actorId, data)

    const contractElectionIds = await Promise.all(positions.map((position) => {
      const title = `${data.title.trim()} - ${position}`
      return createContractElection({
        title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
      })
    }))

    const created = await prisma.electionGroup.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        scope: data.scope,
        organizationId: data.scope === 'ORGANIZATION' ? data.organizationId : null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'UPCOMING',
        elections: {
          create: positions.map((position, index) => ({
            title: `${data.title.trim()} - ${position}`,
            description: data.description.trim(),
            scope: data.scope,
            organizationId: data.scope === 'ORGANIZATION' ? data.organizationId : null,
            positionTitle: position,
            positionOrder: index,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'UPCOMING',
            contractElectionId: contractElectionIds[index],
          })),
        },
      },
      include: {
        organization: { select: { id: true, name: true } },
        elections: {
          orderBy: { positionOrder: 'asc' },
          include: { _count: { select: { candidates: true } } },
        },
      },
    })

    return toGroupSummary(created)
  },

  async delete(id: string, userId: string) {
    const group = await prisma.electionGroup.findUnique({
      where: { id },
      select: { id: true, scope: true, organizationId: true },
    })
    if (!group) throw new Error('Election group not found')
    await assertAdminCanReadGroup(userId, group)

    const elections = await prisma.election.findMany({
      where: { groupId: id },
      select: { id: true },
    })
    const electionIds = elections.map((election) => election.id)

    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { electionId: { in: electionIds } } }),
      prisma.candidate.deleteMany({ where: { electionId: { in: electionIds } } }),
      prisma.election.deleteMany({ where: { id: { in: electionIds } } }),
      prisma.electionGroup.delete({ where: { id } }),
    ])

    return { message: 'Election group deleted successfully' }
  },

  async getResults(id: string) {
    const group = await this.getById(id)
    const positions = []
    for (const election of group.positions) {
      const results = await resultsService.getElectionResults(election.id)
      positions.push({
        electionId: election.id,
        positionTitle: election.positionTitle ?? election.title,
        positionOrder: election.positionOrder ?? 0,
        results,
      })
    }

    return {
      group: {
        id: group.id,
        title: group.title,
        description: group.description,
        status: group.status,
        startDate: group.startDate,
        endDate: group.endDate,
      },
      positions,
    }
  },
}
