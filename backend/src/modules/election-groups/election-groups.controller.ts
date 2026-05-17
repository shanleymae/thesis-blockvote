import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { electionGroupsService } from './election-groups.service'

function handleCommonError(message: string, res: Response) {
  if (message === 'User not found' || message === 'Actor not found' || message === 'Election group not found') {
    return res.status(404).json({ message })
  }
  if (
    message === 'Admin access required' ||
    message === 'You are not allowed to create global elections' ||
    message === 'You are not allowed to manage this election group' ||
    message === 'You can only create elections for your assigned organization'
  ) {
    return res.status(403).json({ message })
  }
  if (
    message === 'User organization not set' ||
    message === 'Admin organization scope is not configured' ||
    message === 'organizationId is required for organization elections' ||
    message === 'Organization not found' ||
    message === 'At least one position is required' ||
    message === 'Position names must be unique'
  ) {
    return res.status(400).json({ message })
  }
  if (message === 'Contract not configured on backend') return res.status(503).json({ message })
  if (message === 'Election was not confirmed on-chain. Try again.') return res.status(502).json({ message })
  return res.status(500).json({ message })
}

export const electionGroupsController = {
  async getList(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined
      const scope = 'GLOBAL'
      const list = await electionGroupsService.getList({ status, scope })
      res.json(list)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async getMyList(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const status = req.query.status as string | undefined
      const list = await electionGroupsService.getForVoter(req.user.id, { status })
      res.json(list)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async getManageList(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const status = req.query.status as string | undefined
      const list = await electionGroupsService.getForAdmin(req.user.id, { status })
      res.json(list)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const group = await electionGroupsService.getById(String(req.params.id ?? ''))
      res.json(group)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async getByIdForAdmin(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const group = await electionGroupsService.getByIdForAdmin(String(req.params.id ?? ''), req.user.id)
      res.json(group)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const { title, description, startDate, endDate, scope, organizationId, positions } = req.body
      if (!title || !description || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields: title, description, startDate, endDate' })
      }
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' })
      }
      if (end <= start) return res.status(400).json({ message: 'endDate must be after startDate' })
      const oneMinuteFromNow = Date.now() + 60 * 1000
      if (start.getTime() < oneMinuteFromNow) {
        return res.status(400).json({ message: 'Start time must be in the future' })
      }
      const normalizedScope = scope === 'ORGANIZATION' ? 'ORGANIZATION' : 'GLOBAL'
      const normalizedPositions = Array.isArray(positions) ? positions.map(String) : ['President']
      const group = await electionGroupsService.create(req.user.id, {
        title,
        description,
        startDate: start,
        endDate: end,
        scope: normalizedScope,
        organizationId: normalizedScope === 'ORGANIZATION' ? organizationId : undefined,
        positions: normalizedPositions,
      })
      res.status(201).json(group)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const result = await electionGroupsService.delete(String(req.params.id ?? ''), req.user.id)
      res.json(result)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },

  async getResults(req: AuthRequest, res: Response) {
    try {
      const results = await electionGroupsService.getResults(String(req.params.id ?? ''))
      res.json(results)
    } catch (e) {
      handleCommonError((e as Error).message, res)
    }
  },
}
