-- Migration: 为 moods 表添加 date_key 列
-- 用于存储基于用户本地时区的日期键，解决时区问题

-- 添加 date_key 列，允许 NULL 值
-- 这个语法在 PostgreSQL 和较新版本的 MySQL 中都支持
ALTER TABLE moods 
ADD COLUMN IF NOT EXISTS date_key VARCHAR(20);

-- 说明:
-- date_key 格式: YYYY-MM-DD (例如: 2025-11-27)
-- 这个字段存储的是用户提交时前端计算的本地日期
-- 用于解决 Vercel 部署时 UTC 时区与用户本地时区不一致的问题
-- 
-- 新记录会在前端提交时自动设置 date_key
-- 旧记录的 date_key 将保持为 NULL，程序会自动回退到使用 created_at
