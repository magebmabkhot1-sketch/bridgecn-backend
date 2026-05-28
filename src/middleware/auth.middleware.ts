import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: string
  email: string
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ 
      message: 'Access token required',
      error: 'NO_TOKEN'
    })
    return
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    const decoded = jwt.verify(token, secret) as JwtPayload
    
    ;(req as any).userId = decoded.userId
    ;(req as any).userEmail = decoded.email
    
    next()
  } catch (error) {
    res.status(403).json({ 
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN'
    })
    return
  }
}