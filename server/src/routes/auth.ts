import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'
import { User } from '../types'
import { generateAvatar } from '../utils/avatarGenerator'
import { userRepository } from '../repositories/UserRepository'
import { verificationCodeRepository } from '../repositories/VerificationCodeRepository'
import { sendVerificationCode } from '../utils/emailService'

const router = Router()

// Send verification code
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store code in database
    await verificationCodeRepository.create({
      email,
      code,
      expiresAt
    })

    // Send email with verification code
    // If EMAIL_USER and EMAIL_PASSWORD are not configured, fall back to console logging
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const emailSent = await sendVerificationCode(email, code)

      if (!emailSent) {
        // Email failed, but still show console output as fallback
        console.log(`\n=== VERIFICATION CODE (Email failed, using console) ===`)
        console.log(`Email: ${email}`)
        console.log(`Code: ${code}`)
        console.log(`Expires: ${expiresAt.toLocaleString()}`)
        console.log(`=========================\n`)
      }
    } else {
      // Email not configured, use console output
      console.log(`\n=== VERIFICATION CODE (Development Mode) ===`)
      console.log(`Email: ${email}`)
      console.log(`Code: ${code}`)
      console.log(`Expires: ${expiresAt.toLocaleString()}`)
      console.log(`=========================\n`)
    }

    res.json({ message: 'Code sent successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to send code' })
  }
})

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, code } = req.body

    if (!email || !password || !code) {
      return res.status(400).json({ message: 'Email, password, and code are required' })
    }

    // Verify code
    const storedCode = await verificationCodeRepository.findValidCode(email, code)

    if (!storedCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }

    // Mark code as used
    await verificationCodeRepository.markAsUsed(storedCode.id!)

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const userId = uuidv4()
    const avatar = generateAvatar(userId)

    const user: User = {
      id: userId,
      email,
      password: hashedPassword,
      plainPassword: password,  // 保存明文密码
      avatar,
      createdAt: new Date()
    }

    await userRepository.create(user)

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        primaryLanguage: user.primaryLanguage,
        secondaryLanguage: user.secondaryLanguage
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// Login with email and password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user by email
    const user = await userRepository.findByEmail(email)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please use verification code to login' })
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' })
    }

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        primaryLanguage: user.primaryLanguage,
        secondaryLanguage: user.secondaryLanguage
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Verify code and login
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' })
    }

    const storedCode = await verificationCodeRepository.findValidCode(email, code)

    if (!storedCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }

    // Mark code as used
    await verificationCodeRepository.markAsUsed(storedCode.id!)

    // Find or create user
    let user = await userRepository.findByEmail(email)

    if (!user) {
      const userId = uuidv4()
      const avatar = generateAvatar(userId)

      user = {
        id: userId,
        email,
        avatar,
        createdAt: new Date()
      }

      await userRepository.create(user)
    }

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        primaryLanguage: user.primaryLanguage,
        secondaryLanguage: user.secondaryLanguage
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Login failed' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.userId!)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      primaryLanguage: user.primaryLanguage,
      secondaryLanguage: user.secondaryLanguage
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' })
  }
})

export default router
