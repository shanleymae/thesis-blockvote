import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { electionsService } from './elections.service'

export const electionsController = {
  async getList(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined
      const scope = 'GLOBAL'
      const list = await electionsService.getList({ status, scope })
      res.json(list)
    } catch (e) {
      const message = (e as Error).message
      if (message === 'Contract not configured on backend') {
        return res.status(503).json({ message })
      }
      if (message === 'Election was not confirmed on-chain. Try again.') {
        return res.status(502).json({ message })
      }
      res.status(500).json({ message })
    }
  },

  async getMyList(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const status = req.query.status as string | undefined
      const list = await electionsService.getForVoter(req.user.id, { status })
      res.json(list)
    } catch (e) {
      const message = (e as Error).message
      if (message === 'User not found') return res.status(404).json({ message })
      if (message === 'User organization not set') return res.status(400).json({ message })
      res.status(500).json({ message })
    }
  },

  async getManageList(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const status = req.query.status as string | undefined
      const list = await electionsService.getForAdmin(req.user.id, { status })
      res.json(list)
    } catch (e) {
      const message = (e as Error).message
      if (message === 'User not found') return res.status(404).json({ message })
      if (message === 'Admin access required') return res.status(403).json({ message })
      res.status(500).json({ message })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ message: 'Election ID is required' })
      const election = await electionsService.getById(id)
      res.json(election)
    } catch (e) {
      if ((e as Error).message === 'Election not found') {
        return res.status(404).json({ message: 'Election not found' })
      }
      res.status(500).json({ message: (e as Error).message })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { title, description, startDate, endDate, scope, organizationId } = req.body
      if (!title || !description || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields: title, description, startDate, endDate' })
      }
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' })
      }
      if (end <= start) {
        return res.status(400).json({ message: 'endDate must be after startDate' })
      }
      const now = Date.now()
      const oneMinuteFromNow = now + 60 * 1000
      if (start.getTime() < oneMinuteFromNow) {
        return res.status(400).json({ message: 'Start time must be in the future' })
      }
      const normalizedScope = scope === 'ORGANIZATION' ? 'ORGANIZATION' : 'GLOBAL'
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const election = await electionsService.create(req.user.id, {
        title,
        description,
        startDate: start,
        endDate: end,
        scope: normalizedScope,
        organizationId: normalizedScope === 'ORGANIZATION' ? organizationId : undefined,
      })
      res.status(201).json(election)
    } catch (e) {
      const message = (e as Error).message
      if (message === 'Actor not found') return res.status(404).json({ message })
      if (message === 'You are not allowed to create global elections') return res.status(403).json({ message })
      if (message === 'Admin organization scope is not configured') return res.status(400).json({ message })
      if (message === 'You can only create elections for your assigned organization') return res.status(403).json({ message })
      if (message === 'organizationId is required for organization elections' || message === 'Organization not found') {
        return res.status(400).json({ message })
      }
      if (message === 'Contract not configured on backend') return res.status(503).json({ message })
      if (message === 'Election was not confirmed on-chain. Try again.') return res.status(502).json({ message })
      res.status(500).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ message: 'Election ID is required' })
      const result = await electionsService.delete(id)
      res.json(result)
    } catch (e) {
      if ((e as Error).message === 'Election not found') {
        return res.status(404).json({ message: 'Election not found' })
      }
      res.status(500).json({ message: (e as Error).message })
    }
  },

  async syncContractIds(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ message: 'Election ID is required' })
      const result = await electionsService.syncContractIds(id)
      res.json(result)
    } catch (e) {
      const message = (e as Error).message
      if (message === 'Election not found') {
        return res.status(404).json({ message })
      }
      if (message === 'Contract not configured on backend') {
        return res.status(503).json({ message })
      }
      if (message === 'Could not locate election on-chain') {
        return res.status(400).json({ message })
      }
      res.status(500).json({ message })
    }
  },
}
