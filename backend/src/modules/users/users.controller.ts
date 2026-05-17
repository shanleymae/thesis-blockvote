import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { usersService } from './users.service'

export const usersController = {
  async getUsers(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const status = req.query.status as string | undefined
      const search = req.query.search as string | undefined
      const page = req.query.page != null ? Number(req.query.page) : undefined
      const limit = req.query.limit != null ? Number(req.query.limit) : undefined
      const data = await usersService.getUsers(req.user.id, { status, search, page, limit })
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      return res.status(500).json({ message })
    }
  },

  async getUserById(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const user = await usersService.getUserById(userId)
      return res.json(user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user'
      return res.status(message === 'User not found' ? 404 : 500).json({ message })
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user?.id
      if (!adminId) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const data = await usersService.deleteUser(adminId, userId)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      const status = message === 'User not found' ? 404 : message === 'You cannot delete your own account' ? 400 : 500
      return res.status(status).json({ message })
    }
  },

  async approveUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const data = await usersService.approveUser(req.user.id, userId)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve user'
      const status =
        message === 'User not found'
          ? 404
          : message === 'You can only manage users in your organization'
            ? 403
          : message === 'Only voter accounts can be approved'
            ? 400
          : message === 'Voter must link a wallet before approval'
            ? 400
            : message === 'Voting contract is not configured'
              ? 503
              : 500
      return res.status(status).json({ message })
    }
  },

  async rejectUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const data = await usersService.rejectUser(req.user.id, userId)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject user'
      const status =
        message === 'User not found'
          ? 404
          : message === 'You can only manage users in your organization'
            ? 403
          : message === 'Only voter accounts can be rejected'
            ? 400
          : message === 'Voting contract is not configured'
            ? 503
            : 500
      return res.status(status).json({ message })
    }
  },

  async revokeUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const data = await usersService.revokeUser(req.user.id, userId)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke user'
      const status =
        message === 'User not found'
          ? 404
          : message === 'You can only manage users in your organization'
            ? 403
          : message === 'Only voter accounts can be revoked'
            ? 400
          : message === 'Voting contract is not configured'
            ? 503
            : 500
      return res.status(status).json({ message })
    }
  },

  async assignAdminScope(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const userId = String(req.params.id || '')
      if (!userId) return res.status(400).json({ message: 'User ID is required' })
      const { role, organizationId, canCreateGlobalElections } = req.body
      if (role !== 'ADMIN' && role !== 'VOTER') {
        return res.status(400).json({ message: 'role must be ADMIN or VOTER' })
      }
      const data = await usersService.assignAdminScope(req.user.id, userId, {
        role,
        organizationId,
        canCreateGlobalElections,
      })
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign admin scope'
      const status =
        message === 'Superadmin access required'
          ? 403
          : message === 'User not found' || message === 'Organization not found'
            ? 404
            : message === 'organizationId is required for admin role' || message === 'Cannot modify superadmin role'
              ? 400
              : 500
      return res.status(status).json({ message })
    }
  },
}
