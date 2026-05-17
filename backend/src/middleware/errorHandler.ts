import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'Photo must be 5MB or smaller' })
    return
  }
  res.status(500).json({ message: err.message || 'Internal server error' })
}
