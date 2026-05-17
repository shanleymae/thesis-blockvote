import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { organizationsService } from './organizations.service'

export const organizationsController = {
  async list(_req: AuthRequest, res: Response) {
    try {
      const items = await organizationsService.list()
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: (error as Error).message })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Organization name is required' })
      }
      const item = await organizationsService.create(name)
      res.status(201).json(item)
    } catch (error) {
      const message = (error as Error).message
      if (message === 'Organization already exists') return res.status(409).json({ message })
      if (message === 'Organization name is required') return res.status(400).json({ message })
      res.status(500).json({ message })
    }
  },
}
