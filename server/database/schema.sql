-- Chiavow Database Schema
-- 创建数据库
CREATE DATABASE IF NOT EXISTS chiavow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chiavow;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  plain_password VARCHAR(255),  -- 明文密码字段（仅用于管理员重置密码）
  username VARCHAR(100),
  avatar TEXT,
  primary_language VARCHAR(10),
  secondary_language VARCHAR(10),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  number_of_travelers INT NOT NULL,
  supply_vehicles BOOLEAN DEFAULT FALSE,
  free_itinerary BOOLEAN DEFAULT FALSE,
  medical_companion BOOLEAN DEFAULT FALSE,
  business_service BOOLEAN DEFAULT FALSE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'paid', 'cancelled') DEFAULT 'active',
  user_read BOOLEAN DEFAULT TRUE,  -- 用户是否已读
  admin_read BOOLEAN DEFAULT FALSE,  -- 管理员是否已读
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 行程表（订单的行程明细）
CREATE TABLE IF NOT EXISTS trip_segments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  city VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_city (city),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员操作日志表（为后台管理系统准备）
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(36),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'string',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认联系方式配置
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('contact_email', 'contact@chiavow.com', 'string', '联系邮箱'),
('contact_phone', '+1 234 567 8900', 'string', '联系电话'),
('contact_wechat', 'chiavow_official', 'string', '微信号'),
('contact_twitter', 'https://twitter.com/chiavow', 'string', 'Twitter链接'),
('contact_facebook', 'https://facebook.com/chiavow', 'string', 'Facebook链接'),
('contact_instagram', 'https://instagram.com/chiavow', 'string', 'Instagram链接'),
('contact_whatsapp', 'https://wa.me/1234567890', 'string', 'WhatsApp链接'),
('contact_enabled_methods', 'email,phone,wechat,twitter', 'json', '启用的联系方式（逗号分隔）')
ON DUPLICATE KEY UPDATE config_key=config_key;

-- 行程留言表
CREATE TABLE IF NOT EXISTS trip_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'replied', 'closed') DEFAULT 'pending',
  user_read BOOLEAN DEFAULT TRUE,  -- 用户是否已读
  admin_read BOOLEAN DEFAULT FALSE,  -- 管理员是否已读
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 行程留言回复表
CREATE TABLE IF NOT EXISTS trip_message_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,  -- 可以是用户ID或管理员ID，不设置外键约束
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,  -- 标识是否为管理员回复
  is_read BOOLEAN DEFAULT FALSE,  -- 回复是否已读
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES trip_messages(id) ON DELETE CASCADE,
  INDEX idx_message_id (message_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建默认管理员账户
-- 用户名：jiahou
-- 密码：qipeng
INSERT INTO admins (id, username, password, email, created_at)
VALUES (
  UUID(),
  'jiahou',
  '$2b$10$/S3RH3/zeEoOac/Lb619y.3CrmRiZjX2Rh8TabqNS/8b6toAYDBIm',
  'jiaqi@chiavow.com',
  NOW()
) ON DUPLICATE KEY UPDATE username=username;

-- 同时在 users 表中创建管理员账户（用于兼容）
-- 邮箱：jiaqi@chiavow.com
INSERT INTO users (id, email, password, plain_password, username, role, created_at)
VALUES (
  UUID(),
  'jiaqi@chiavow.com',
  '$2b$10$/S3RH3/zeEoOac/Lb619y.3CrmRiZjX2Rh8TabqNS/8b6toAYDBIm',
  'qipeng',
  'jiahou',
  'admin',
  NOW()
) ON DUPLICATE KEY UPDATE email=email;
