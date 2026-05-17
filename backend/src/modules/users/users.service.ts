import prisma from '../../config/db'
import { getContract } from '../../config/contract'

const userListSelect = {
  id: true,
  name: true,
  email: true,
  idNumber: true,
  phone: true,
  role: true,
  status: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
  canCreateGlobalElections: true,
  walletAddress: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
}

type UserListWhere = {
  role?: 'SUPERADMIN' | 'ADMIN' | 'VOTER'
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' }
    email?: { contains: string; mode: 'insensitive' }
  }>
}

async function isWalletApprovedOnChain(walletAddress: string) {
  const contract = getContract()
  if (!contract) throw new Error('Voting contract is not configured')

  try {
    const isApproved = await contract.getFunction('isVoterApproved')(walletAddress)
    return Boolean(isApproved)
  } catch {
    const voter = await contract.getFunction('voters')(walletAddress)
    if (Array.isArray(voter)) {
      return Boolean(voter[0])
    }
    if (typeof voter === 'object' && voter != null && 'isApproved' in voter) {
      return Boolean((voter as { isApproved?: boolean }).isApproved)
    }
    return false
  }
}

async function ensureCanManageUser(actorId: string, targetUserId: string) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true, organizationId: true } }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, organizationId: true, walletAddress: true, status: true },
    }),
  ])
  if (!actor) throw new Error('User not found')
  if (!target) throw new Error('User not found')
  if (actor.role === 'SUPERADMIN') return target
  if (actor.role !== 'ADMIN') throw new Error('Admin access required')
  if (target.role !== 'VOTER') throw new Error('Only voter accounts can be managed by admins')
  if (!actor.organizationId || target.organizationId !== actor.organizationId) {
    throw new Error('You can only manage users in your organization')
  }
  return target
}

export const usersService = {
  async getUsers(actorId: string, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.min(100, Math.max(1, query.limit ?? 50))
    const skip = (page - 1) * limit

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true, organizationId: true },
    })
    if (!actor) throw new Error('User not found')

    const where: UserListWhere = {}
    if (actor.role === 'ADMIN') {
      where.role = 'VOTER'
    }
    if (query.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(query.status)) {
      where.status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED'
    }
    if (query.search?.trim()) {
      const term = query.search.trim()
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: actor.role === 'SUPERADMIN'
          ? { ...where, NOT: { role: 'SUPERADMIN' } }
          : {
              ...where,
              organizationId: actor.organizationId ?? undefined,
            },
        select: userListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])
    return { users, total, page, limit }
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userListSelect,
    })
    if (!user) throw new Error('User not found')
    return user
  },

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) throw new Error('You cannot delete your own account')
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])
    return { message: 'User deleted successfully' }
  },

  async approveUser(actorId: string, userId: string) {
    const user = await ensureCanManageUser(actorId, userId)
    if (user.role !== 'VOTER') throw new Error('Only voter accounts can be approved')
    if (!user.walletAddress) throw new Error('Voter must link a wallet before approval')

    const contract = getContract()
    if (!contract) throw new Error('Voting contract is not configured')

    const approvedOnChain = await isWalletApprovedOnChain(user.walletAddress)
    if (!approvedOnChain) {
      const tx = await contract.getFunction('approveVoter')(user.walletAddress)
      await tx.wait()
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'APPROVED' },
    })
    return { message: 'Voter approved' }
  },

  async rejectUser(actorId: string, userId: string) {
    const user = await ensureCanManageUser(actorId, userId)
    if (user.role !== 'VOTER') throw new Error('Only voter accounts can be rejected')

    if (user.status === 'APPROVED' && user.walletAddress) {
      const contract = getContract()
      if (!contract) throw new Error('Voting contract is not configured')

      const approvedOnChain = await isWalletApprovedOnChain(user.walletAddress)
      if (approvedOnChain) {
        const tx = await contract.getFunction('revokeVoter')(user.walletAddress)
        await tx.wait()
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'REJECTED' },
    })
    return { message: 'Voter rejected' }
  },

  async revokeUser(actorId: string, userId: string) {
    const user = await ensureCanManageUser(actorId, userId)
    if (user.role !== 'VOTER') throw new Error('Only voter accounts can be revoked')

    if (user.walletAddress) {
      const contract = getContract()
      if (!contract) throw new Error('Voting contract is not configured')

      const approvedOnChain = await isWalletApprovedOnChain(user.walletAddress)
      if (approvedOnChain) {
        const tx = await contract.getFunction('revokeVoter')(user.walletAddress)
        await tx.wait()
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'PENDING' },
    })
    return { message: 'Voter revoked' }
  },

  async assignAdminScope(
    actorId: string,
    targetUserId: string,
    input: { role: 'ADMIN' | 'VOTER'; organizationId?: string | null; canCreateGlobalElections?: boolean }
  ) {
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } })
    if (!actor || actor.role !== 'SUPERADMIN') throw new Error('Superadmin access required')

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, role: true } })
    if (!target) throw new Error('User not found')
    if (target.role === 'SUPERADMIN') throw new Error('Cannot modify superadmin role')

    if (input.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: input.organizationId }, select: { id: true } })
      if (!org) throw new Error('Organization not found')
    }

    if (input.role === 'ADMIN') {
      if (!input.organizationId) throw new Error('organizationId is required for admin role')
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          role: 'ADMIN',
          organizationId: input.organizationId,
          canCreateGlobalElections: Boolean(input.canCreateGlobalElections),
        },
      })
      return { message: 'User promoted to admin with scoped permissions' }
    }

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          role: 'VOTER',
          organizationId: input.organizationId ?? undefined,
          canCreateGlobalElections: false,
        },
      })
    return { message: 'User role set to voter' }
  },
}
