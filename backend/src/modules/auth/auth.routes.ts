import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { authController } from './auth.controller'

const router = Router()

router.post('/register', authController.register.bind(authController))
router.post('/resend-verification', authController.resendVerification.bind(authController))
router.get('/verify-email', authController.verifyEmail.bind(authController))
router.post('/login', authController.login.bind(authController))
router.get('/wallet/status', authController.walletStatus.bind(authController))
router.post('/wallet/nonce', authController.walletNonce.bind(authController))
router.post('/wallet/login', authController.walletLogin.bind(authController))
router.get('/me', authenticate, authController.me.bind(authController))
router.patch('/wallet', authenticate, authController.updateWallet.bind(authController))
router.patch('/profile', authenticate, authController.updateProfile.bind(authController))
router.delete('/account', authenticate, authController.deleteAccount.bind(authController))

export default router
