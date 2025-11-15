import pool from '../config/database'
import { User } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface UserRow extends RowDataPacket {
  id: string
  email: string
  password?: string
  plain_password?: string
  username?: string
  avatar?: string
  primary_language?: string
  secondary_language?: string
  role: 'user' | 'admin'
  created_at: Date
  updated_at: Date
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    if (rows.length === 0) return null

    return this.mapRowToUser(rows[0])
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) return null

    return this.mapRowToUser(rows[0])
  }

  async create(user: Omit<User, 'createdAt'>): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (id, email, password, plain_password, username, avatar, primary_language, secondary_language, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.password || null,
        user.plainPassword || null,
        user.username || null,
        user.avatar || null,
        user.primaryLanguage || null,
        user.secondaryLanguage || null,
        'user'
      ]
    )

    const createdUser = await this.findById(user.id)
    if (!createdUser) throw new Error('Failed to create user')

    return createdUser
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = []
    const values: any[] = []

    if (updates.username !== undefined) {
      fields.push('username = ?')
      values.push(updates.username)
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?')
      values.push(updates.avatar)
    }
    if (updates.primaryLanguage !== undefined) {
      fields.push('primary_language = ?')
      values.push(updates.primaryLanguage)
    }
    if (updates.secondaryLanguage !== undefined) {
      fields.push('secondary_language = ?')
      values.push(updates.secondaryLanguage)
    }
    if (updates.password !== undefined) {
      fields.push('password = ?')
      values.push(updates.password)
    }
    if (updates.plainPassword !== undefined) {
      fields.push('plain_password = ?')
      values.push(updates.plainPassword)
    }

    if (fields.length === 0) return this.findById(id)

    values.push(id)

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return this.findById(id)
  }

  // 更新用户密码（同时更新加密密码和明文密码）
  async updatePassword(id: string, hashedPassword: string, plainPassword: string): Promise<User | null> {
    await pool.query(
      'UPDATE users SET password = ?, plain_password = ? WHERE id = ?',
      [hashedPassword, plainPassword, id]
    )

    return this.findById(id)
  }

  async findAll(page: number = 1, limit: number = 20, search?: string): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit
    let query = 'SELECT * FROM users'
    let countQuery = 'SELECT COUNT(*) as total FROM users'
    const params: any[] = []

    if (search) {
      query += ' WHERE email LIKE ? OR username LIKE ?'
      countQuery += ' WHERE email LIKE ? OR username LIKE ?'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query<UserRow[]>(query, params)
    const [countRows] = await pool.query<RowDataPacket[]>(
      countQuery,
      search ? [`%${search}%`, `%${search}%`] : []
    )

    return {
      users: rows.map(row => this.mapRowToUser(row)),
      total: countRows[0].total
    }
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    )

    return result.affectedRows > 0
  }

  private mapRowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      plainPassword: row.plain_password,
      username: row.username,
      avatar: row.avatar,
      primaryLanguage: row.primary_language,
      secondaryLanguage: row.secondary_language,
      createdAt: row.created_at
    }
  }
}

export const userRepository = new UserRepository()
