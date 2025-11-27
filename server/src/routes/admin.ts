import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { generateAdminToken, adminAuthMiddleware, AdminAuthRequest } from '../middleware/adminAuth'
import { adminRepository } from '../repositories/AdminRepository'
import { userRepository } from '../repositories/UserRepository'
import { orderRepository } from '../repositories/OrderRepository'
import { systemConfigRepository } from '../repositories/SystemConfigRepository'
import { tripMessageRepository } from '../repositories/TripMessageRepository'
import pool from '../config/database'
import { RowDataPacket } from 'mysql2'

const router = Router()

// Admin login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    // Find admin by username
    const admin = await adminRepository.findByUsername(username)

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' })
    }

    if (!admin.password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateAdminToken(admin.id, admin.role)

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Get users list (pagination, search)
router.get('/users', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string

    const { users, total } = await userRepository.findAll(page, limit, search)

    // Get order count for each user
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const ordersCount = await orderRepository.countByUserId(user.id)
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          primaryLanguage: user.primaryLanguage,
          secondaryLanguage: user.secondaryLanguage,
          plainPassword: user.plainPassword,
          createdAt: user.createdAt,
          ordersCount
        }
      })
    )

    res.json({
      data: usersWithOrderCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Failed to get users' })
  }
})

// Update user
router.put('/users/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Check if user exists
    const user = await userRepository.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update user
    const updatedUser = await userRepository.update(id, updates)

    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update user' })
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        primaryLanguage: updatedUser.primaryLanguage,
        secondaryLanguage: updatedUser.secondaryLanguage
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Failed to update user' })
  }
})

// Delete user
router.delete('/users/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if user exists
    const user = await userRepository.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Delete user's orders first (cascade delete)
    await pool.query('DELETE FROM orders WHERE user_id = ?', [id])

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id])

    res.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

// Update user password
router.put('/users/:id/password', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password || password.trim().length === 0) {
      return res.status(400).json({ message: 'Password is required' })
    }

    // Check if user exists
    const user = await userRepository.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password (both hashed and plain text)
    await userRepository.updatePassword(id, hashedPassword, password)

    res.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({ message: 'Failed to update password' })
  }
})

// Get orders list (pagination, search by order ID or user)
router.get('/orders', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string
    const status = req.query.status as string

    const filters: any = {}
    if (search) {
      filters.search = search
    }
    if (status) {
      filters.status = status
    }

    const { orders, total } = await orderRepository.findAll(page, limit, filters)

    // Fetch user information for each order
    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        const user = await userRepository.findById(order.userId)
        return {
          id: order.id,
          userId: order.userId,
          userEmail: user?.email,
          username: user?.username,
          trips: order.trips,
          travelers: order.numberOfTravelers,
          supplyVehicles: order.supplyVehicles,
          freeItinerary: order.freeItinerary,
          medicalCompanion: order.medicalCompanion,
          businessService: order.businessService,
          totalPrice: order.totalAmount,
          status: order.status,
          userRead: order.userRead,
          adminRead: order.adminRead,
          createdAt: order.createdAt,
          updatedAt: order.createdAt
        }
      })
    )

    res.json({
      data: ordersWithUserInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ message: 'Failed to get orders' })
  }
})

// Set order price
router.put('/orders/:id/price', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { totalAmount } = req.body

    console.log('Setting order price:', { id, totalAmount })

    if (totalAmount === undefined || totalAmount === null) {
      return res.status(400).json({ message: 'Total amount is required' })
    }

    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return res.status(400).json({ message: 'Invalid total amount' })
    }

    // Check if order exists
    const order = await orderRepository.findById(id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    console.log('Found order:', order.id, 'Current price:', order.totalAmount)

    // Update order price
    await pool.query(
      'UPDATE orders SET total_amount = ? WHERE id = ?',
      [totalAmount, id]
    )

    console.log('Price updated successfully')

    const updatedOrder = await orderRepository.findById(id)

    res.json({
      message: 'Order price updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Update order price error:', error)
    res.status(500).json({ message: 'Failed to update order price' })
  }
})

// Update order status
router.put('/orders/:id/status', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const validStatuses = ['active', 'paid', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: active, paid, cancelled' })
    }

    // Check if order exists
    const order = await orderRepository.findById(id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Update order status
    const updatedOrder = await orderRepository.updateStatus(id, status)

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ message: 'Failed to update order status' })
  }
})

// Delete order
router.delete('/orders/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if order exists
    const order = await orderRepository.findById(id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Delete order
    await pool.query('DELETE FROM orders WHERE id = ?', [id])

    res.json({
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Delete order error:', error)
    res.status(500).json({ message: 'Failed to delete order' })
  }
})

// Get unread order count for admin
router.get('/orders/unread-count', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const count = await orderRepository.countUnreadForAdmin()
    res.json({ count })
  } catch (error) {
    console.error('Get unread order count error:', error)
    res.status(500).json({ message: 'Failed to get unread count' })
  }
})

// Mark an order as read by admin
router.patch('/orders/:id/read', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const order = await orderRepository.findById(id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await orderRepository.markAsReadByAdmin(id)

    res.json({ message: 'Order marked as read' })
  } catch (error) {
    console.error('Mark order as read error:', error)
    res.status(500).json({ message: 'Failed to mark order as read' })
  }
})

// Get statistics
router.get('/stats', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    // Get total users
    const [userCountRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM users'
    )
    const totalUsers = userCountRows[0].total

    // Get total orders
    const [orderCountRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM orders'
    )
    const totalOrders = orderCountRows[0].total

    // Get total revenue (sum of all paid orders)
    const [revenueRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'"
    )
    const totalRevenue = Number(revenueRows[0].total)

    // Get pending orders count
    const [pendingOrdersRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'active'"
    )
    const pendingOrders = pendingOrdersRows[0].total

    // Get completed orders count
    const [completedOrdersRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'paid'"
    )
    const completedOrders = completedOrdersRows[0].total

    // Get cancelled orders count
    const [cancelledOrdersRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'cancelled'"
    )
    const cancelledOrders = cancelledOrdersRows[0].total

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Failed to get statistics' })
  }
})

// Get contact configuration
router.get('/config/contact', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const configs = await systemConfigRepository.findByKeyPrefix('contact_')

    const contactConfig: any = {}
    configs.forEach(config => {
      const key = config.key.replace('contact_', '')
      contactConfig[key] = config.value
    })

    res.json(contactConfig)
  } catch (error) {
    console.error('Get contact config error:', error)
    res.status(500).json({ message: 'Failed to get contact configuration' })
  }
})

// Update contact configuration
router.put('/config/contact', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const updates = req.body

    const configUpdates = Object.keys(updates).map(key => ({
      key: `contact_${key}`,
      value: updates[key]
    }))

    await systemConfigRepository.updateMultiple(configUpdates)

    res.json({
      message: 'Contact configuration updated successfully'
    })
  } catch (error) {
    console.error('Update contact config error:', error)
    res.status(500).json({ message: 'Failed to update contact configuration' })
  }
})

// Get unread message count for admin
router.get('/trip-messages/unread-count', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const count = await tripMessageRepository.countUnreadForAdmin()
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ message: 'Failed to get unread count' })
  }
})

// Mark a message as read by admin
router.patch('/trip-messages/:id/read', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    await tripMessageRepository.markAsReadByAdmin(id)

    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Mark message as read error:', error)
    res.status(500).json({ message: 'Failed to mark message as read' })
  }
})

// Get all trip messages
router.get('/trip-messages', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const messages = await tripMessageRepository.findAll()

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
router.get('/trip-messages/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    const replies = await tripMessageRepository.findRepliesByMessageId(id)

    res.json({ ...message, replies })
  } catch (error) {
    console.error('Get trip message error:', error)
    res.status(500).json({ message: 'Failed to get trip message' })
  }
})

// Admin reply to trip message
router.post('/trip-messages/:id/replies', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const adminId = req.adminId!

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' })
    }

    const message = await tripMessageRepository.findById(id)

    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    const reply = await tripMessageRepository.addReply({
      messageId: id,
      userId: adminId,
      content: content.trim(),
      isAdmin: true
    })

    res.status(201).json(reply)
  } catch (error) {
    console.error('Add reply error:', error)
    res.status(500).json({ message: 'Failed to add reply' })
  }
})

// Update trip message status
router.put('/trip-messages/:id/status', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const validStatuses = ['pending', 'replied', 'closed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: pending, replied, closed' })
    }

    const updatedMessage = await tripMessageRepository.updateStatus(id, status)

    if (!updatedMessage) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    res.json({
      message: 'Trip message status updated successfully',
      tripMessage: updatedMessage
    })
  } catch (error) {
    console.error('Update trip message status error:', error)
    res.status(500).json({ message: 'Failed to update trip message status' })
  }
})

// Delete trip message
router.delete('/trip-messages/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const message = await tripMessageRepository.findById(id)
    if (!message) {
      return res.status(404).json({ message: 'Trip message not found' })
    }

    await tripMessageRepository.delete(id)

    res.json({
      message: 'Trip message deleted successfully'
    })
  } catch (error) {
    console.error('Delete trip message error:', error)
    res.status(500).json({ message: 'Failed to delete trip message' })
  }
})

export default router
