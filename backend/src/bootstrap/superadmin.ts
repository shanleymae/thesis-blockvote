import bcrypt from 'bcryptjs'
import prisma from '../config/db'

const SALT_ROUNDS = 10
const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@blockvote.local'
const DEFAULT_SUPERADMIN_NAME = 'Super Admin'

export async function ensureSuperAdmin() {
  const password = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!password) {
    return
  }

  const email = (process.env.SUPERADMIN_EMAIL?.trim() || DEFAULT_SUPERADMIN_EMAIL).toLowerCase()
  const name = process.env.SUPERADMIN_NAME?.trim() || DEFAULT_SUPERADMIN_NAME

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'APPROVED',
      isVerified: true,
      canCreateGlobalElections: true,
      verifyToken: null,
    },
  })

  console.log(`[bootstrap] superadmin account ensured for ${email}`)
}
