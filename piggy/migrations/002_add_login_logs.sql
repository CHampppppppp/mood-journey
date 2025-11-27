-- Migration: 创建登录日志表
-- 用于记录 piggy 的登录时间（隐式记录，不显示给用户）
-- 兼容 MySQL 和 Postgres

-- Postgres 版本
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  logged_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MySQL 版本（如果表不存在则创建）
-- CREATE TABLE IF NOT EXISTS login_logs (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   logged_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   user_agent TEXT,
--   ip_address VARCHAR(45),
--   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- 创建索引以优化按时间查询（Postgres）
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_in_at 
ON login_logs (logged_in_at DESC);

-- MySQL 创建索引（如果不存在）
-- CREATE INDEX idx_login_logs_logged_in_at ON login_logs (logged_in_at DESC);

-- 说明:
-- logged_in_at: 登录时间（用户进入笔记本的时间）
-- user_agent: 浏览器信息（可选）
-- ip_address: IP 地址（可选，如果前端能获取到）
-- created_at: 记录创建时间
--
-- 注意：根据你的数据库类型（MySQL 或 Postgres），取消注释对应的 CREATE TABLE 语句

