import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/db'

export interface AuthRequest extends Request {
  user?: { id: string; role: 'SUPERADMIN' | 'ADMIN' | 'VOTER' }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    })
    if (!user) return res.status(401).json({ message: 'Invalid token' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
