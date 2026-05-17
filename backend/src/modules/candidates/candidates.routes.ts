import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/role'
import { uploadCandidatePhoto } from '../../middleware/upload'
import { candidatesController } from './candidates.controller'

const router = Router({ mergeParams: true })

router.get('/', candidatesController.getList.bind(candidatesController))
router.get('/:candidateId/photo', candidatesController.getPhoto.bind(candidatesController))
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadCandidatePhoto.single('photo'),
  candidatesController.create.bind(candidatesController)
)

export default router
