import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/role'
import { electionGroupsController } from './election-groups.controller'

const router = Router()

router.get('/', electionGroupsController.getList.bind(electionGroupsController))
router.get('/mine', authenticate, electionGroupsController.getMyList.bind(electionGroupsController))
router.get('/manage', authenticate, requireAdmin, electionGroupsController.getManageList.bind(electionGroupsController))
router.post('/', authenticate, requireAdmin, electionGroupsController.create.bind(electionGroupsController))
router.get('/:id/admin', authenticate, requireAdmin, electionGroupsController.getByIdForAdmin.bind(electionGroupsController))
router.get('/:id/results', electionGroupsController.getResults.bind(electionGroupsController))
router.get('/:id', electionGroupsController.getById.bind(electionGroupsController))
router.delete('/:id', authenticate, requireAdmin, electionGroupsController.delete.bind(electionGroupsController))

export default router
