import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'

async function createAdmin() {
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)

  const adminId = uuidv4()

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role ENUM('super_admin', 'admin') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      INSERT IGNORE INTO admins (id, username, password, email, role)
      VALUES (?, ?, ?, ?, ?)
    `, [adminId, 'admin', hashedPassword, 'admin@chiavow.com', 'super_admin'])

    console.log('✅ Admin table created')
    console.log('✅ Default admin user created:')
    console.log('   Username: admin')
    console.log('   Password: admin123')
    console.log('   Email: admin@chiavow.com')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()
