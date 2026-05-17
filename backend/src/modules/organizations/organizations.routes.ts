import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/role'
import { organizationsController } from './organizations.controller'

const router = Router()

router.get('/', organizationsController.list.bind(organizationsController))
router.post('/', authenticate, requireAdmin, organizationsController.create.bind(organizationsController))

export default router
