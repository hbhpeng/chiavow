import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { adminRepository } from '../repositories/AdminRepository'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AdminAuthRequest extends Request {
  adminId?: string
  adminRole?: 'super_admin' | 'admin'
}

export const generateAdminToken = (adminId: string, role: 'super_admin' | 'admin'): string => {
  return jwt.sign({ adminId, role, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyAdminToken = (token: string): { adminId: string; role: 'super_admin' | 'admin'; isAdmin: boolean } => {
  return jwt.verify(token, JWT_SECRET) as { adminId: string; role: 'super_admin' | 'admin'; isAdmin: boolean }
}

export const adminAuthMiddleware = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAdminToken(token)

    // Verify that this is an admin token
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    // Verify admin exists in database
    const admin = await adminRepository.findById(decoded.adminId)
    if (!admin) {
      return res.status(403).json({ message: 'Admin account not found' })
    }

    req.adminId = decoded.adminId
    req.adminRole = decoded.role

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
