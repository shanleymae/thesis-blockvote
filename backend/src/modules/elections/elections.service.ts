import prisma from '../../config/db'
import { getContract } from '../../config/contract'

function syncStatusByTime(election: { startDate: Date; endDate: Date; status: string }): 'UPCOMING' | 'ACTIVE' | 'CLOSED' {
  const now = new Date()
  const start = new Date(election.startDate)
  const end = new Date(election.endDate)
  if (now < start) return 'UPCOMING'
  if (now > end) return 'CLOSED'
  return 'ACTIVE'
}

async function syncElectionStatusInDb(id: string) {
  const election = await prisma.election.findUnique({ where: { id } })
  if (!election) return
  const derived = syncStatusByTime(election)
  if (derived !== election.status) {
    await prisma.election.update({
      where: { id },
      data: { status: derived },
    })
  }
}

export const electionsService = {
  async getList(query: { status?: string; scope?: 'GLOBAL' | 'ORGANIZATION' }) {
    const where: { status?: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'; scope?: 'GLOBAL' | 'ORGANIZATION' } = {}
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      where.status = query.status as 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
    }
    if (query.scope && ['GLOBAL', 'ORGANIZATION'].includes(query.scope)) {
      where.scope = query.scope
    }
    const elections = await prisma.election.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { candidates: true } }, organization: { select: { id: true, name: true } } },
    })
    const synced = []
    for (const e of elections) {
      const derived = syncStatusByTime(e)
      if (derived !== e.status) {
        await prisma.election.update({
          where: { id: e.id },
          data: { status: derived },
        })
        synced.push({ ...e, status: derived, _count: e._count })
      } else {
        synced.push(e)
      }
    }
    return synced.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      scope: e.scope,
      organizationId: e.organizationId,
      organization: e.organization,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      contractElectionId: e.contractElectionId,
      resultsPublished: e.resultsPublished,
      resultsPublishedAt: e.resultsPublishedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      candidateCount: (e as { _count?: { candidates: number } })._count?.candidates ?? 0,
    }))
  },

  async getForVoter(userId: string, query: { status?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })
    if (!user) throw new Error('User not found')
    if (!user.organizationId) throw new Error('User organization not set')

    const where: {
      status?: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
      OR: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }>
    } = {
      OR: [
        { scope: 'GLOBAL' },
        { scope: 'ORGANIZATION', organizationId: user.organizationId },
      ],
    }
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      where.status = query.status as 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
    }

    const elections = await prisma.election.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { candidates: true } }, organization: { select: { id: true, name: true } } },
    })
    return elections.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      scope: e.scope,
      organizationId: e.organizationId,
      organization: e.organization,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      contractElectionId: e.contractElectionId,
      resultsPublished: e.resultsPublished,
      resultsPublishedAt: e.resultsPublishedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      candidateCount: e._count.candidates,
    }))
  },

  async getForAdmin(userId: string, query: { status?: string }) {
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true, canCreateGlobalElections: true },
    })
    if (!actor) throw new Error('User not found')
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') throw new Error('Admin access required')

    const baseWhere: {
      status?: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
      OR?: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }>
    } = {}
    if (query.status && ['UPCOMING', 'ACTIVE', 'CLOSED', 'PAUSED'].includes(query.status)) {
      baseWhere.status = query.status as 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'PAUSED'
    }
    if (actor.role === 'ADMIN') {
      const orConditions: Array<{ scope: 'GLOBAL' } | { scope: 'ORGANIZATION'; organizationId: string }> = []
      if (actor.organizationId) {
        orConditions.push({ scope: 'ORGANIZATION', organizationId: actor.organizationId })
      }
      if (actor.canCreateGlobalElections) {
        orConditions.push({ scope: 'GLOBAL' })
      }
      baseWhere.OR = orConditions
    }

    const elections = await prisma.election.findMany({
      where: baseWhere,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { candidates: true } }, organization: { select: { id: true, name: true } } },
    })

    return elections.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      scope: e.scope,
      organizationId: e.organizationId,
      organization: e.organization,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      contractElectionId: e.contractElectionId,
      resultsPublished: e.resultsPublished,
      resultsPublishedAt: e.resultsPublishedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      candidateCount: e._count.candidates,
    }))
  },

  async getById(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
      include: { candidates: true, organization: { select: { id: true, name: true } } },
    })
    if (!election) throw new Error('Election not found')
    await syncElectionStatusInDb(id)
    const updated = await prisma.election.findUnique({
      where: { id },
      include: { candidates: true, organization: { select: { id: true, name: true } } },
    })
    return updated!
  },

  async create(
    actorId: string,
    data: { title: string; description: string; startDate: Date; endDate: Date; scope: 'GLOBAL' | 'ORGANIZATION'; organizationId?: string }
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

    const startTs = Math.floor(new Date(data.startDate).getTime() / 1000)
    const endTs = Math.floor(new Date(data.endDate).getTime() / 1000)
    const contract = getContract()
    if (!contract) {
      throw new Error('Contract not configured on backend')
    }
    const createElection = contract.getFunction('createElection')
    const tx = await createElection(data.title, data.description, startTs, endTs)
    const receipt = await tx.wait()
    const allLogs = receipt?.logs ?? []
    const contractAddress = (contract.target as string).toLowerCase()
    const ourLogs = allLogs.filter((log: { address?: string }) => String(log?.address ?? '').toLowerCase() === contractAddress)
    const iface = contract.interface
    const logsToTry = ourLogs.length > 0 ? ourLogs : allLogs

    let contractElectionId: number | null = null
    for (const log of logsToTry) {
      try {
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
        if (parsed?.name === 'ElectionCreated') {
          const id = parsed.args.electionId
          contractElectionId = id != null ? Number(id) : null
          if (contractElectionId != null) break
        }
      } catch {
        // skip logs that don't match our ABI
      }
    }

    if (contractElectionId == null) {
      throw new Error('Election was not confirmed on-chain. Try again.')
    }

    const created = await prisma.election.create({
      data: {
        title: data.title,
        description: data.description,
        scope: data.scope,
        organizationId: data.scope === 'ORGANIZATION' ? data.organizationId : null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'UPCOMING',
        contractElectionId,
      },
      include: { _count: { select: { candidates: true } } },
    })
    const { _count, ...e } = created
    return { ...e, candidateCount: _count.candidates }
  },

  async delete(id: string) {
    const election = await prisma.election.findUnique({ where: { id } })
    if (!election) throw new Error('Election not found')

    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { electionId: id } }),
      prisma.candidate.deleteMany({ where: { electionId: id } }),
      prisma.election.delete({ where: { id } }),
    ])

    return { message: 'Election deleted successfully' }
  },

  async syncContractIds(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
      include: { candidates: true },
    })
    if (!election) throw new Error('Election not found')

    const contract = getContract()
    if (!contract) {
      throw new Error('Contract not configured on backend')
    }

    const normalize = (value: string) => value.trim().toLowerCase()
    let resolvedElectionId = election.contractElectionId

    if (resolvedElectionId == null) {
      const getTotalElections = contract.getFunction('getTotalElections')
      const getElection = contract.getFunction('getElection')
      const total = Number(await getTotalElections())
      const targetTitle = normalize(election.title)

      for (let i = 1; i <= total; i += 1) {
        const chainElection = await getElection(i)
        const chainTitle = normalize(String(chainElection.title ?? ''))
        if (chainTitle === targetTitle) {
          resolvedElectionId = i
          break
        }
      }
    }

    if (resolvedElectionId == null) {
      throw new Error('Could not locate election on-chain')
    }

    if (election.contractElectionId == null) {
      await prisma.election.update({
        where: { id: election.id },
        data: { contractElectionId: resolvedElectionId },
      })
    }

    const getElection = contract.getFunction('getElection')
    const getCandidate = contract.getFunction('candidates')
    const chainElection = await getElection(resolvedElectionId)
    const chainCandidateCount = Number(chainElection.candidateCount ?? 0)
    const candidateIdByName = new Map<string, number>()
    const chainCandidates = await Promise.all(
      Array.from({ length: chainCandidateCount }, (_, index) => {
        const candidateId = index + 1
        return getCandidate(resolvedElectionId, candidateId).then((candidate) => ({
          candidate,
          candidateId,
        }))
      })
    )
    for (const { candidate: chainCandidate, candidateId } of chainCandidates) {
      if (Boolean(chainCandidate.exists)) {
        const chainName = normalize(String(chainCandidate.name ?? ''))
        if (!candidateIdByName.has(chainName)) {
          candidateIdByName.set(chainName, candidateId)
        }
      }
    }

    let syncedCandidates = 0
    for (const candidate of election.candidates) {
      if (candidate.contractCandidateId != null) continue
      const match = candidateIdByName.get(normalize(candidate.name))
      if (match != null) {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { contractCandidateId: match },
        })
        syncedCandidates += 1
      }
    }

    return {
      message: 'Contract sync completed',
      contractElectionId: resolvedElectionId,
      syncedCandidates,
    }
  },
}
