import pool from '../config/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface SystemConfigRow extends RowDataPacket {
  id: number
  config_key: string
  config_value: string | null
  config_type: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface SystemConfig {
  id: number
  key: string
  value: string | null
  type: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export class SystemConfigRepository {
  async findByKey(key: string): Promise<SystemConfig | null> {
    const [rows] = await pool.query<SystemConfigRow[]>(
      'SELECT * FROM system_config WHERE config_key = ?',
      [key]
    )

    if (rows.length === 0) return null

    return this.mapRowToConfig(rows[0])
  }

  async findAll(): Promise<SystemConfig[]> {
    const [rows] = await pool.query<SystemConfigRow[]>(
      'SELECT * FROM system_config ORDER BY config_key'
    )

    return rows.map(row => this.mapRowToConfig(row))
  }

  async findByKeyPrefix(prefix: string): Promise<SystemConfig[]> {
    const [rows] = await pool.query<SystemConfigRow[]>(
      'SELECT * FROM system_config WHERE config_key LIKE ? ORDER BY config_key',
      [`${prefix}%`]
    )

    return rows.map(row => this.mapRowToConfig(row))
  }

  async updateValue(key: string, value: string): Promise<SystemConfig | null> {
    await pool.query(
      'UPDATE system_config SET config_value = ? WHERE config_key = ?',
      [value, key]
    )

    return this.findByKey(key)
  }

  async updateMultiple(configs: Array<{ key: string; value: string }>): Promise<void> {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      for (const config of configs) {
        await connection.query(
          'UPDATE system_config SET config_value = ? WHERE config_key = ?',
          [config.value, config.key]
        )
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async create(config: { key: string; value: string; type?: string; description?: string }): Promise<SystemConfig> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO system_config (config_key, config_value, config_type, description)
       VALUES (?, ?, ?, ?)`,
      [config.key, config.value, config.type || 'string', config.description || null]
    )

    const created = await this.findByKey(config.key)
    if (!created) throw new Error('Failed to create config')

    return created
  }

  private mapRowToConfig(row: SystemConfigRow): SystemConfig {
    return {
      id: row.id,
      key: row.config_key,
      value: row.config_value,
      type: row.config_type,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const systemConfigRepository = new SystemConfigRepository()
