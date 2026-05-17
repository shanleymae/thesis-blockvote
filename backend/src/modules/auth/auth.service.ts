import bcrypt from 'bcryptjs'
import { ethers } from 'ethers'
import prisma from '../../config/db'
import { getContract } from '../../config/contract'
import { generateToken } from '../../utils/generateToken'
import { sendVerificationEmail } from '../../utils/sendEmail'
import { isEmailAndIdOnVoterRoll, normalizeIdNumber as normalizeStoredIdNumber } from '../../utils/voterRoll'

const SALT_ROUNDS = 10
const WALLET_LOGIN_NONCE_TTL_MS = 5 * 60 * 1000
const walletLoginNonces = new Map<string, { nonce: string; expiresAt: number }>()

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  canCreateGlobalElections: true,
  walletAddress: true,
  idNumber: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  organization: {
    select: { id: true, name: true },
  },
}

function normalizeWalletAddress(walletAddress: string) {
  return ethers.getAddress(walletAddress.trim())
}

function walletMatches(left?: string | null, right?: string | null) {
  if (!left || !right) return false
  return left.toLowerCase() === right.toLowerCase()
}

function buildWalletLoginMessage(walletAddress: string, nonce: string) {
  return [
    'Sign this message to log in to Blockvote.',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
  ].join('\n')
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}*@${domain}`
  return `${localPart.slice(0, 2)}***@${domain}`
}

/** When true, new voters are verified without email; login skips verification checks. See SKIP_EMAIL_VERIFICATION in README. */
function isEmailVerificationSkipped() {
  const v = process.env.SKIP_EMAIL_VERIFICATION?.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}

async function isWalletApprovedOnChain(walletAddress: string) {
  const contract = getContract()
  if (!contract) throw new Error('Voting contract is not configured')

  try {
    const isApproved = await contract.getFunction('isVoterApproved')(walletAddress)
    return Boolean(isApproved)
  } catch {
    const voter = await contract.getFunction('voters')(walletAddress)
    if (Array.isArray(voter)) {
      return Boolean(voter[0])
    }
    if (typeof voter === 'object' && voter != null && 'isApproved' in voter) {
      return Boolean((voter as { isApproved?: boolean }).isApproved)
    }
    return false
  }
}

export const authService = {
  async register(data: {
    name: string
    email: string
    password: string
    phone?: string
    walletAddress: string
    organizationId: string
    idNumber: string
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Email already registered')

    const normalizedWalletAddress = normalizeWalletAddress(data.walletAddress)
    const existingWalletOwner = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      select: { id: true },
    })
    if (existingWalletOwner) throw new Error('Wallet already registered')
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
      select: { id: true },
    })
    if (!organization) throw new Error('Organization not found')

    const normalizedIdNumber = normalizeStoredIdNumber(data.idNumber)
    if (!normalizedIdNumber) throw new Error('ID number is required')

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
    const skipVerify = isEmailVerificationSkipped()
    const verifyToken = skipVerify ? null : crypto.randomUUID()

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone ?? null,
        role: 'VOTER',
        status: 'PENDING',
        organizationId: data.organizationId,
        walletAddress: normalizedWalletAddress,
        idNumber: normalizedIdNumber,
        isVerified: skipVerify,
        verifyToken,
      },
    })

    if (!skipVerify && verifyToken) {
      console.log('[auth] register:queue-verification-email', { email: maskEmail(data.email) })
      void sendVerificationEmail(data.email, verifyToken).catch((err) => {
        console.error('[auth] verification email failed after register', err)
      })
    } else {
      console.log('[auth] register:skip-email-verification', { email: maskEmail(data.email) })
    }

    return {
      message: skipVerify
        ? 'Account created. Email verification is disabled on this server—you can sign in now. Your account is still pending administrator approval before you can vote.'
        : 'Account created. Check your inbox for a verification link before signing in. If nothing arrives in a few minutes, use “Resend verification” on the login page.',
      emailVerificationSkipped: skipVerify,
    }
  },

  /**
   * Sends a new verification link. Response is generic so email existence is not leaked.
   */
  async resendVerificationEmail(email: string) {
    if (isEmailVerificationSkipped()) {
      return {
        message:
          'Email verification is disabled on this server. Sign in with your email and password or your wallet if you already registered.',
      }
    }

    const trimmed = email.trim()
    const generic = {
      message:
        'If that email has an unverified account, a new verification link is on the way. Check your inbox and spam folder.',
    }
    if (!trimmed) {
      return generic
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: trimmed, mode: 'insensitive' } },
      select: { id: true, email: true, isVerified: true, role: true },
    })

    if (!user || user.isVerified || user.role !== 'VOTER') {
      return generic
    }

    const newToken = crypto.randomUUID()
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: newToken },
    })

    console.log('[auth] resend:queue-verification-email', { email: maskEmail(user.email) })
    void sendVerificationEmail(user.email, newToken).catch((err) => {
      console.error('[auth] resend verification email failed', err)
    })

    return generic
  },

  async verifyEmail(token: string): Promise<{ message: string; autoApproved: boolean }> {
    const pending = await prisma.user.findFirst({
      where: { verifyToken: token, isVerified: false },
      select: { id: true, email: true, idNumber: true },
    })

    if (!pending) {
      return { message: 'Token already used or invalid', autoApproved: false }
    }

    const idNorm = pending.idNumber?.trim()
    const autoApproved = Boolean(idNorm && isEmailAndIdOnVoterRoll(pending.email, idNorm))

    await prisma.user.update({
      where: { id: pending.id },
      data: {
        isVerified: true,
        verifyToken: null,
        ...(autoApproved ? { status: 'APPROVED' as const } : {}),
      },
    })

    const message = autoApproved
      ? 'Email verified. Your email and ID are on the official voter roster — your account is approved to vote.'
      : 'Email verified successfully. Your account is pending administrator approval before you can vote.'

    return { message, autoApproved }
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!user) throw new Error('Invalid email or password')

    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new Error('Invalid email or password')

    if (!isEmailVerificationSkipped() && !user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    const token = generateToken(user.id, user.role)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        organization: user.organization,
        canCreateGlobalElections: user.canCreateGlobalElections,
        walletAddress: user.walletAddress,
      },
    }
  },

  async createWalletLoginNonce(walletAddress: string) {
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress)
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      select: { id: true, isVerified: true },
    })

    if (!user) throw new Error('No account is linked to this wallet')
    if (!isEmailVerificationSkipped() && !user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    const nonce = crypto.randomUUID()
    walletLoginNonces.set(normalizedWalletAddress.toLowerCase(), {
      nonce,
      expiresAt: Date.now() + WALLET_LOGIN_NONCE_TTL_MS,
    })

    return {
      walletAddress: normalizedWalletAddress,
      message: buildWalletLoginMessage(normalizedWalletAddress, nonce),
    }
  },

  async getWalletRegistrationStatus(walletAddress: string) {
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress)
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      select: {
        id: true,
        email: true,
        isVerified: true,
        status: true,
      },
    })

    if (!user) {
      return {
        walletAddress: normalizedWalletAddress,
        isRegistered: false,
      }
    }

    return {
      walletAddress: normalizedWalletAddress,
      isRegistered: true,
      isVerified: user.isVerified || isEmailVerificationSkipped(),
      status: user.status,
      maskedEmail: maskEmail(user.email),
    }
  },

  async loginWithWallet(walletAddress: string, signature: string) {
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress)
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!user) throw new Error('No account is linked to this wallet')
    if (!isEmailVerificationSkipped() && !user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    const nonceRecord = walletLoginNonces.get(normalizedWalletAddress.toLowerCase())
    if (!nonceRecord || nonceRecord.expiresAt < Date.now()) {
      walletLoginNonces.delete(normalizedWalletAddress.toLowerCase())
      throw new Error('Wallet login request expired. Please try again')
    }

    const expectedMessage = buildWalletLoginMessage(normalizedWalletAddress, nonceRecord.nonce)
    const recoveredAddress = ethers.verifyMessage(expectedMessage, signature)
    if (!walletMatches(recoveredAddress, normalizedWalletAddress)) {
      throw new Error('Wallet signature could not be verified')
    }

    walletLoginNonces.delete(normalizedWalletAddress.toLowerCase())

    const token = generateToken(user.id, user.role)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        organization: user.organization,
        canCreateGlobalElections: user.canCreateGlobalElections,
        walletAddress: user.walletAddress,
      },
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    })
    if (!user) throw new Error('User not found')
    return user
  },

  async updateWallet(userId: string, walletAddress: string) {
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        walletAddress: true,
      },
    })
    if (!currentUser) throw new Error('User not found')

    const existingWalletOwner = await prisma.user.findFirst({
      where: {
        walletAddress: normalizedWalletAddress,
        NOT: { id: userId },
      },
      select: { id: true },
    })
    if (existingWalletOwner) {
      throw new Error('This wallet is already linked to another account')
    }

    if (walletMatches(currentUser.walletAddress, normalizedWalletAddress)) {
      return authService.me(userId)
    }

    const data: { walletAddress: string; status?: 'PENDING' } = {
      walletAddress: normalizedWalletAddress,
    }

    if (currentUser.status === 'APPROVED') {
      const contract = getContract()
      if (!contract) throw new Error('Voting contract is not configured')

      if (currentUser.walletAddress) {
        const approvedOnChain = await isWalletApprovedOnChain(currentUser.walletAddress)
        if (approvedOnChain) {
          const revokeTx = await contract.getFunction('revokeVoter')(currentUser.walletAddress)
          await revokeTx.wait()
        }
      }

      data.status = 'PENDING'
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect,
    })
    return user
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string | null }) {
    const update: { name?: string; phone?: string | null } = {}
    if (data.name !== undefined && data.name.trim()) update.name = data.name.trim()
    if (data.phone !== undefined) update.phone = data.phone === '' ? null : data.phone
    if (Object.keys(update).length === 0) return authService.me(userId)
    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: profileSelect,
    })
    return user
  },

  async deleteAccount(userId: string) {
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])
    return { message: 'Account deleted successfully' }
  },
}
