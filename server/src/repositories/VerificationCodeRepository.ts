import pool from '../config/database'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface VerificationCode {
  id?: number
  email: string
  code: string
  expiresAt: Date
  used: boolean
  createdAt?: Date
}

class VerificationCodeRepository {
  /**
   * Create a new verification code
   */
  async create(data: Omit<VerificationCode, 'id' | 'createdAt' | 'used'>): Promise<VerificationCode> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO verification_codes (email, code, expires_at, used) VALUES (?, ?, ?, FALSE)',
      [data.email, data.code, data.expiresAt]
    )

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM verification_codes WHERE id = ?',
      [result.insertId]
    )

    return this.mapRowToVerificationCode(rows[0])
  }

  /**
   * Find a valid verification code by email and code
   */
  async findValidCode(email: string, code: string): Promise<VerificationCode | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM verification_codes
       WHERE email = ? AND code = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code]
    )

    if (rows.length === 0) return null
    return this.mapRowToVerificationCode(rows[0])
  }

  /**
   * Mark a verification code as used
   */
  async markAsUsed(id: number): Promise<void> {
    await pool.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [id]
    )
  }

  /**
   * Delete expired verification codes (cleanup)
   */
  async deleteExpired(): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM verification_codes WHERE expires_at < NOW()'
    )
    return result.affectedRows
  }

  /**
   * Map database row to VerificationCode object
   */
  private mapRowToVerificationCode(row: RowDataPacket): VerificationCode {
    return {
      id: row.id,
      email: row.email,
      code: row.code,
      expiresAt: row.expires_at,
      used: row.used,
      createdAt: row.created_at
    }
  }
}

export const verificationCodeRepository = new VerificationCodeRepository()
