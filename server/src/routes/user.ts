import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { userRepository } from '../repositories/UserRepository'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const avatarUrl = `/uploads/${req.file.filename}`

    res.json({ url: avatarUrl })
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload avatar' })
  }
})

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Update profile request for user:', req.userId)
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200)) // Log first 200 chars to avoid flooding

    const user = await userRepository.findById(req.userId!)

    if (!user) {
      console.log('User not found:', req.userId)
      return res.status(404).json({ message: 'User not found' })
    }

    const { username, primaryLanguage, secondaryLanguage, avatar } = req.body

    const updates: any = {}
    if (username) updates.username = username
    if (primaryLanguage) updates.primaryLanguage = primaryLanguage
    if (secondaryLanguage !== undefined) updates.secondaryLanguage = secondaryLanguage
    if (avatar) updates.avatar = avatar

    console.log('Updating user with:', { ...updates, avatar: avatar ? `${avatar.substring(0, 50)}...` : undefined })

    const updatedUser = await userRepository.update(user.id, updates)

    if (!updatedUser) {
      console.log('Failed to update user in database')
      return res.status(500).json({ message: 'Failed to update profile' })
    }

    console.log('Profile updated successfully for user:', req.userId)

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      primaryLanguage: updatedUser.primaryLanguage,
      secondaryLanguage: updatedUser.secondaryLanguage
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

export default router
