import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { Order } from '../types'
import { orderRepository } from '../repositories/OrderRepository'

const router = Router()

// Create order
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      trips,
      numberOfTravelers,
      supplyVehicles,
      freeItinerary,
      tailorMade
    } = req.body

    if (!trips || trips.length === 0) {
      return res.status(400).json({ message: 'At least one trip is required' })
    }

    if (!numberOfTravelers || numberOfTravelers < 1 || numberOfTravelers > 5) {
      return res.status(400).json({ message: 'Number of travelers must be between 1 and 5' })
    }

    // Set initial price to 0, admin will set the actual price later
    const totalAmount = 0

    const order: Order = {
      id: uuidv4(),
      userId: req.userId!,
      trips,
      numberOfTravelers,
      supplyVehicles: supplyVehicles || false,
      freeItinerary: freeItinerary || false,
      tailorMade: tailorMade || false,
      totalAmount,
      status: 'active',
      userRead: true,  // User created it, so it's read for them
      adminRead: false,  // New order is unread for admin
      createdAt: new Date()
    }

    const createdOrder = await orderRepository.create(order)

    res.json(createdOrder)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order' })
  }
})

// Get user orders
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userOrders = await orderRepository.findByUserId(req.userId!)
    res.json(userOrders)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders' })
  }
})

// Cancel order
router.put('/:orderId/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params
    const order = await orderRepository.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (order.status !== 'active') {
      return res.status(400).json({ message: 'Can only cancel active orders' })
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, 'cancelled')

    res.json(updatedOrder)
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order' })
  }
})

// Pay order
router.put('/:orderId/pay', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params
    const order = await orderRepository.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (order.status !== 'active') {
      return res.status(400).json({ message: 'Can only pay active orders' })
    }

    // In production, integrate with payment gateway here
    const updatedOrder = await orderRepository.updateStatus(orderId, 'paid')

    res.json(updatedOrder)
  } catch (error) {
    res.status(500).json({ message: 'Failed to pay order' })
  }
})

// Get unread order count for the authenticated user
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const count = await orderRepository.countUnreadForUser(userId)
    res.json({ count })
  } catch (error) {
    console.error('Get unread order count error:', error)
    res.status(500).json({ message: 'Failed to get unread count' })
  }
})

// Mark an order as read by user
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const order = await orderRepository.findById(id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if the user owns this order
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await orderRepository.markAsReadByUser(id)

    res.json({ message: 'Order marked as read' })
  } catch (error) {
    console.error('Mark order as read error:', error)
    res.status(500).json({ message: 'Failed to mark order as read' })
  }
})

export default router
