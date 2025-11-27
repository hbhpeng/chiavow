import pool from '../config/database'
import { Order, TripSegment } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface OrderRow extends RowDataPacket {
  id: string
  user_id: string
  number_of_travelers: number
  supply_vehicles: boolean
  free_itinerary: boolean
  medical_companion: boolean
  business_service: boolean
  total_amount: number
  status: 'active' | 'paid' | 'cancelled'
  user_read: boolean
  admin_read: boolean
  created_at: Date
  updated_at: Date
}

interface TripRow extends RowDataPacket {
  id: number
  order_id: string
  city: string
  start_date: string
  end_date: string
  created_at: Date
}

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const [orderRows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    )

    if (orderRows.length === 0) return null

    const [tripRows] = await pool.query<TripRow[]>(
      'SELECT * FROM trip_segments WHERE order_id = ?',
      [id]
    )

    return this.mapRowToOrder(orderRows[0], tripRows)
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const [orderRows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )

    const orders: Order[] = []

    for (const orderRow of orderRows) {
      const [tripRows] = await pool.query<TripRow[]>(
        'SELECT * FROM trip_segments WHERE order_id = ?',
        [orderRow.id]
      )

      orders.push(this.mapRowToOrder(orderRow, tripRows))
    }

    return orders
  }

  async create(order: Omit<Order, 'createdAt'>): Promise<Order> {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Insert order
      await connection.query<ResultSetHeader>(
        `INSERT INTO orders (id, user_id, number_of_travelers, supply_vehicles, free_itinerary, medical_companion, business_service, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.userId,
          order.numberOfTravelers,
          order.supplyVehicles,
          order.freeItinerary,
          order.medicalCompanion,
          order.businessService,
          order.totalAmount,
          order.status
        ]
      )

      // Insert trip segments
      for (const trip of order.trips) {
        await connection.query<ResultSetHeader>(
          `INSERT INTO trip_segments (order_id, city, start_date, end_date)
           VALUES (?, ?, ?, ?)`,
          [order.id, trip.city, trip.startDate, trip.endDate]
        )
      }

      await connection.commit()

      const createdOrder = await this.findById(order.id)
      if (!createdOrder) throw new Error('Failed to create order')

      return createdOrder
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async updateStatus(id: string, status: 'active' | 'paid' | 'cancelled'): Promise<Order | null> {
    await pool.query<ResultSetHeader>(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    )

    return this.findById(id)
  }

  async findAll(page: number = 1, limit: number = 20, filters?: {
    userId?: string
    status?: string
    search?: string
  }): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit
    const conditions: string[] = []
    const params: any[] = []

    if (filters?.userId) {
      conditions.push('o.user_id = ?')
      params.push(filters.userId)
    }

    if (filters?.status) {
      conditions.push('o.status = ?')
      params.push(filters.status)
    }

    if (filters?.search) {
      conditions.push('(o.id LIKE ? OR u.email LIKE ? OR u.username LIKE ?)')
      const searchParam = `%${filters.search}%`
      params.push(searchParam, searchParam, searchParam)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const query = `
      SELECT o.*
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `

    params.push(limit, offset)

    const [orderRows] = await pool.query<OrderRow[]>(query, params)
    const [countRows] = await pool.query<RowDataPacket[]>(
      countQuery,
      params.slice(0, -2)
    )

    const orders: Order[] = []

    for (const orderRow of orderRows) {
      const [tripRows] = await pool.query<TripRow[]>(
        'SELECT * FROM trip_segments WHERE order_id = ?',
        [orderRow.id]
      )

      orders.push(this.mapRowToOrder(orderRow, tripRows))
    }

    return {
      orders,
      total: countRows[0].total
    }
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM orders WHERE id = ?',
      [id]
    )

    return result.affectedRows > 0
  }

  private mapRowToOrder(orderRow: OrderRow, tripRows: TripRow[]): Order {
    return {
      id: orderRow.id,
      userId: orderRow.user_id,
      trips: tripRows.map(trip => ({
        city: trip.city,
        startDate: trip.start_date,
        endDate: trip.end_date
      })),
      numberOfTravelers: orderRow.number_of_travelers,
      supplyVehicles: Boolean(orderRow.supply_vehicles),
      freeItinerary: Boolean(orderRow.free_itinerary),
      medicalCompanion: Boolean(orderRow.medical_companion),
      businessService: Boolean(orderRow.business_service),
      totalAmount: Number(orderRow.total_amount),
      status: orderRow.status,
      userRead: Boolean(orderRow.user_read),
      adminRead: Boolean(orderRow.admin_read),
      createdAt: orderRow.created_at
    }
  }

  // Count unread orders for user
  async countUnreadForUser(userId: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE user_id = ? AND user_read = false`,
      [userId]
    )
    return rows[0]?.count || 0
  }

  // Count total orders for a user
  async countByUserId(userId: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE user_id = ?`,
      [userId]
    )
    return rows[0]?.count || 0
  }

  // Count unread orders for admin
  async countUnreadForAdmin(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE admin_read = false`
    )
    return rows[0]?.count || 0
  }

  // Mark an order as read by user
  async markAsReadByUser(orderId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE orders SET user_read = true WHERE id = ?',
      [orderId]
    )
  }

  // Mark an order as read by admin
  async markAsReadByAdmin(orderId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE orders SET admin_read = true WHERE id = ?',
      [orderId]
    )
  }
}

export const orderRepository = new OrderRepository()
