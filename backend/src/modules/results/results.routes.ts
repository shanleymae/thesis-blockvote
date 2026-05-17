import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/role'
import { resultsController } from './results.controller'

const router = Router()

router.get('/:electionId', resultsController.getResults.bind(resultsController))
router.get('/:electionId/logs', authenticate, requireAdmin, resultsController.getLogs.bind(resultsController))
router.post('/:electionId/publish', authenticate, requireAdmin, resultsController.publish.bind(resultsController))

export default router

