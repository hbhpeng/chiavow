import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { tripMessageRepository } from '../repositories/TripMessageRepository'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// Get unread message count for the authenticated user
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const count = await tripMessageRepository.countUnreadForUser(userId)
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ message: 'Failed to get unread count' })
  }
})

// Mark a message as read by user
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    // Check if the user owns this message
    if (message.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await tripMessageRepository.markAsReadByUser(id)

    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Mark message as read error:', error)
    res.status(500).json({ message: 'Failed to mark message as read' })
  }
})

// Get all trip messages for the authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const messages = await tripMessageRepository.findByUserId(userId)

    // Fetch replies for each message
    const messagesWithReplies = await Promise.all(
      messages.map(async (message) => {
        const replies = await tripMessageRepository.findRepliesByMessageId(message.id)
        return { ...message, replies }
      })
    )

    res.json(messagesWithReplies)
  } catch (error) {
    console.error('Get trip messages error:', error)
    res.status(500).json({ message: 'Failed to get trip messages' })
  }
})

// Get a single trip message with replies
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    // Check if the user owns this message
    if (message.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const replies = await tripMessageRepository.findRepliesByMessageId(id)

    res.json({ ...message, replies })
  } catch (error) {
    console.error('Get trip message error:', error)
    res.status(500).json({ message: 'Failed to get trip message' })
  }
})

// Create a new trip message
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body
    const userId = req.userId!

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const tripMessage = await tripMessageRepository.create({
      id: uuidv4(),
      userId,
      message: message.trim()
    })

    res.status(201).json(tripMessage)
  } catch (error) {
    console.error('Create trip message error:', error)
    res.status(500).json({ message: 'Failed to create trip message' })
  }
})

// Add a reply to a trip message
router.post('/:id/replies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.userId!

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' })
    }

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    // Check if the user owns this message
    if (message.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const reply = await tripMessageRepository.addReply({
      messageId: id,
      userId,
      content: content.trim(),
      isAdmin: false
    })

    res.status(201).json(reply)
  } catch (error) {
    console.error('Add reply error:', error)
    res.status(500).json({ message: 'Failed to add reply' })
  }
})

export default router
