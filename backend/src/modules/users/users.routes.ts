import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { requireAdmin, requireSuperAdmin } from '../../middleware/role'
import { usersController } from './users.controller'

const router = Router()

router.get('/', authenticate, requireAdmin, usersController.getUsers.bind(usersController))
router.get('/:id', authenticate, requireAdmin, usersController.getUserById.bind(usersController))
router.patch('/:id/approve', authenticate, requireAdmin, usersController.approveUser.bind(usersController))
router.patch('/:id/reject', authenticate, requireAdmin, usersController.rejectUser.bind(usersController))
router.patch('/:id/revoke', authenticate, requireAdmin, usersController.revokeUser.bind(usersController))
router.patch('/:id/role-scope', authenticate, requireSuperAdmin, usersController.assignAdminScope.bind(usersController))
router.delete('/:id', authenticate, requireAdmin, usersController.deleteUser.bind(usersController))

export default router
