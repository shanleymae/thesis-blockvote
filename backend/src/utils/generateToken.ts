import jwt from 'jsonwebtoken'

export const generateToken = (id: string, role: 'SUPERADMIN' | 'ADMIN' | 'VOTER'): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  )
}
