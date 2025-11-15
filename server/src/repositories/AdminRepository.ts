import pool from '../config/database'
import { Admin } from '../types/admin'
import { RowDataPacket } from 'mysql2'

interface AdminRow extends RowDataPacket {
  id: string
  username: string
  password: string
  email: string
  role: 'super_admin' | 'admin'
  created_at: Date
  updated_at: Date
}

export class AdminRepository {
  async findById(id: string): Promise<Admin | null> {
    const [rows] = await pool.query<AdminRow[]>(
      'SELECT * FROM admins WHERE id = ?',
      [id]
    )

    if (rows.length === 0) return null

    return this.mapRowToAdmin(rows[0])
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const [rows] = await pool.query<AdminRow[]>(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    )

    if (rows.length === 0) return null

    return this.mapRowToAdmin(rows[0])
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const [rows] = await pool.query<AdminRow[]>(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    )

    if (rows.length === 0) return null

    return this.mapRowToAdmin(rows[0])
  }

  private mapRowToAdmin(row: AdminRow): Admin {
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const adminRepository = new AdminRepository()
