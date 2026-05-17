import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { authService } from './auth.service'

export const authController = {
  async register(req: AuthRequest, res: Response) {
    try {
      const { name, email, password, phone, walletAddress, organizationId, idNumber } = req.body
      if (
        !name ||
        !email ||
        !password ||
        !walletAddress ||
        !organizationId ||
        idNumber === undefined ||
        idNumber === null ||
        String(idNumber).trim() === ''
      ) {
        return res
          .status(400)
          .json({
            message:
              'Name, email, password, walletAddress, organizationId and idNumber are required',
          })
      }
      const data = await authService.register({
        name,
        email,
        password,
        phone,
        walletAddress,
        organizationId,
        idNumber: String(idNumber),
      })
      return res.status(201).json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      const invalidAddress = message.toLowerCase().includes('invalid address')
      const status =
        message === 'Email already registered' || message === 'Wallet already registered'
          ? 409
          : message === 'Organization not found'
            ? 400
          : invalidAddress
            ? 400
            : 400
      return res.status(status).json({ message })
    }
  },

  async resendVerification(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body as { email?: string }
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' })
      }
      const data = await authService.resendVerificationEmail(email)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed'
      return res.status(500).json({ message })
    }
  },

  async verifyEmail(req: AuthRequest, res: Response) {
    try {
      const token = req.query.token as string
      if (!token) return res.status(400).json({ message: 'Token is required' })
      const data = await authService.verifyEmail(token)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      return res.status(400).json({ message })
    }
  },

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' })
      }
      const data = await authService.login(email, password)
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      const status = message.includes('verify your email') ? 403 : 401
      return res.status(status).json({ message })
    }
  },

  async walletNonce(req: AuthRequest, res: Response) {
    try {
      const { walletAddress } = req.body
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: 'walletAddress is required' })
      }
      const data = await authService.createWalletLoginNonce(walletAddress.trim())
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare wallet login'
      const invalidAddress = message.toLowerCase().includes('invalid address')
      const status =
        message === 'No account is linked to this wallet'
          ? 404
          : message.includes('verify your email')
            ? 403
            : invalidAddress
              ? 400
              : 400
      return res.status(status).json({ message })
    }
  },

  async walletStatus(req: AuthRequest, res: Response) {
    try {
      const { walletAddress } = req.query
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: 'walletAddress is required' })
      }
      const data = await authService.getWalletRegistrationStatus(walletAddress.trim())
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check wallet status'
      const invalidAddress = message.toLowerCase().includes('invalid address')
      return res.status(invalidAddress ? 400 : 500).json({ message })
    }
  },

  async walletLogin(req: AuthRequest, res: Response) {
    try {
      const { walletAddress, signature } = req.body
      if (!walletAddress || !signature || typeof walletAddress !== 'string' || typeof signature !== 'string') {
        return res.status(400).json({ message: 'walletAddress and signature are required' })
      }
      const data = await authService.loginWithWallet(walletAddress.trim(), signature.trim())
      return res.json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet login failed'
      const invalidAddress = message.toLowerCase().includes('invalid address')
      const status =
        message === 'No account is linked to this wallet'
          ? 404
          : message.includes('verify your email')
            ? 403
            : invalidAddress || message.includes('expired') || message.includes('verified')
              ? 400
              : 401
      return res.status(status).json({ message })
    }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const user = await authService.me(req.user.id)
      return res.json(user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get user'
      return res.status(500).json({ message })
    }
  },

  async updateWallet(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const { walletAddress } = req.body
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: 'walletAddress is required' })
      }
      const user = await authService.updateWallet(req.user.id, walletAddress.trim())
      return res.json(user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update wallet'
      const invalidAddress = message.toLowerCase().includes('invalid address')
      const status =
        message === 'User not found'
          ? 404
          : message === 'This wallet is already linked to another account' ||
              invalidAddress
            ? 400
            : message === 'Voting contract is not configured'
              ? 503
              : 500
      return res.status(status).json({ message })
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      const { name, phone } = req.body
      const user = await authService.updateProfile(req.user.id, { name, phone })
      return res.json(user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      return res.status(500).json({ message })
    }
  },

  async deleteAccount(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
      await authService.deleteAccount(req.user.id)
      return res.json({ message: 'Account deleted successfully' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      return res.status(500).json({ message })
    }
  },
}
