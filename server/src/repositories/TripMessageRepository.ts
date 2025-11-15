import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

export interface TripMessage {
  id: string
  userId: string
  message: string
  status: 'pending' | 'replied' | 'closed'
  userRead: boolean
  adminRead: boolean
  createdAt: Date
  updatedAt: Date
  username?: string
  email?: string
}

export interface TripMessageReply {
  id: number
  messageId: string
  userId: string
  content: string
  isAdmin: boolean
  isRead: boolean
  createdAt: Date
  username?: string
  email?: string
}

interface TripMessageRow extends RowDataPacket {
  id: string
  user_id: string
  message: string
  status: 'pending' | 'replied' | 'closed'
  user_read: boolean
  admin_read: boolean
  created_at: Date
  updated_at: Date
  username?: string
  email?: string
}

interface TripMessageReplyRow extends RowDataPacket {
  id: number
  message_id: string
  user_id: string
  content: string
  is_admin: boolean
  is_read: boolean
  created_at: Date
  username?: string
  email?: string
}

export class TripMessageRepository {
  // Create a new trip message
  async create(message: { id: string; userId: string; message: string }): Promise<TripMessage> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO trip_messages (id, user_id, message) VALUES (?, ?, ?)`,
      [message.id, message.userId, message.message]
    )

    const created = await this.findById(message.id)
    if (!created) throw new Error('Failed to create trip message')

    return created
  }

  // Find trip message by ID
  async findById(id: string): Promise<TripMessage | null> {
    const [rows] = await pool.query<TripMessageRow[]>(
      `SELECT tm.*, u.username, u.email
       FROM trip_messages tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.id = ?`,
      [id]
    )

    if (rows.length === 0) return null
    return this.mapRowToMessage(rows[0])
  }

  // Find all trip messages for a user
  async findByUserId(userId: string): Promise<TripMessage[]> {
    const [rows] = await pool.query<TripMessageRow[]>(
      `SELECT tm.*, u.username, u.email
       FROM trip_messages tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.user_id = ?
       ORDER BY tm.created_at DESC`,
      [userId]
    )

    return rows.map(row => this.mapRowToMessage(row))
  }

  // Find all trip messages (for admin)
  async findAll(): Promise<TripMessage[]> {
    const [rows] = await pool.query<TripMessageRow[]>(
      `SELECT tm.*, u.username, u.email
       FROM trip_messages tm
       LEFT JOIN users u ON tm.user_id = u.id
       ORDER BY tm.created_at DESC`
    )

    return rows.map(row => this.mapRowToMessage(row))
  }

  // Update trip message status
  async updateStatus(id: string, status: 'pending' | 'replied' | 'closed'): Promise<TripMessage | null> {
    await pool.query(
      `UPDATE trip_messages SET status = ? WHERE id = ?`,
      [status, id]
    )

    return this.findById(id)
  }

  // Add a reply to a trip message
  async addReply(reply: {
    messageId: string
    userId: string
    content: string
    isAdmin: boolean
  }): Promise<TripMessageReply> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO trip_message_replies (message_id, user_id, content, is_admin)
       VALUES (?, ?, ?, ?)`,
      [reply.messageId, reply.userId, reply.content, reply.isAdmin]
    )

    // Update message status and read flags when reply is added
    if (reply.isAdmin) {
      // Admin replied: set admin_read=true, user_read=false, status='replied'
      await pool.query(
        `UPDATE trip_messages
         SET status = 'replied', admin_read = true, user_read = false
         WHERE id = ?`,
        [reply.messageId]
      )
    } else {
      // User replied: set user_read=true, admin_read=false
      await pool.query(
        `UPDATE trip_messages
         SET user_read = true, admin_read = false
         WHERE id = ?`,
        [reply.messageId]
      )
    }

    const created = await this.findReplyById(result.insertId)
    if (!created) throw new Error('Failed to create reply')

    return created
  }

  // Find reply by ID
  async findReplyById(id: number): Promise<TripMessageReply | null> {
    const [rows] = await pool.query<TripMessageReplyRow[]>(
      `SELECT tmr.*, u.username, u.email
       FROM trip_message_replies tmr
       LEFT JOIN users u ON tmr.user_id = u.id
       WHERE tmr.id = ?`,
      [id]
    )

    if (rows.length === 0) return null
    return this.mapRowToReply(rows[0])
  }

  // Find all replies for a message
  async findRepliesByMessageId(messageId: string): Promise<TripMessageReply[]> {
    const [rows] = await pool.query<TripMessageReplyRow[]>(
      `SELECT tmr.*, u.username, u.email
       FROM trip_message_replies tmr
       LEFT JOIN users u ON tmr.user_id = u.id
       WHERE tmr.message_id = ?
       ORDER BY tmr.created_at ASC`,
      [messageId]
    )

    return rows.map(row => this.mapRowToReply(row))
  }

  // Delete a trip message
  async delete(id: string): Promise<void> {
    await pool.query(`DELETE FROM trip_messages WHERE id = ?`, [id])
  }

  // Mark message as read by user
  async markAsReadByUser(messageId: string): Promise<void> {
    await pool.query(
      `UPDATE trip_messages SET user_read = true WHERE id = ?`,
      [messageId]
    )
  }

  // Mark message as read by admin
  async markAsReadByAdmin(messageId: string): Promise<void> {
    await pool.query(
      `UPDATE trip_messages SET admin_read = true WHERE id = ?`,
      [messageId]
    )
  }

  // Count unread messages for user (messages where admin replied and user hasn't read)
  async countUnreadForUser(userId: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM trip_messages
       WHERE user_id = ? AND user_read = false`,
      [userId]
    )
    return rows[0]?.count || 0
  }

  // Count unread messages for admin (all messages where admin hasn't read)
  async countUnreadForAdmin(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM trip_messages
       WHERE admin_read = false`
    )
    return rows[0]?.count || 0
  }

  private mapRowToMessage(row: TripMessageRow): TripMessage {
    return {
      id: row.id,
      userId: row.user_id,
      message: row.message,
      status: row.status,
      userRead: row.user_read,
      adminRead: row.admin_read,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      username: row.username,
      email: row.email
    }
  }

  private mapRowToReply(row: TripMessageReplyRow): TripMessageReply {
    return {
      id: row.id,
      messageId: row.message_id,
      userId: row.user_id,
      content: row.content,
      isAdmin: row.is_admin,
      isRead: row.is_read,
      createdAt: row.created_at,
      username: row.username,
      email: row.email
    }
  }
}

export const tripMessageRepository = new TripMessageRepository()
