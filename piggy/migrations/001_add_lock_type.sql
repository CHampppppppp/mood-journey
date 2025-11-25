-- Migration: 为 account_locks 表添加 lock_type 列
-- 用于区分密码锁定 (password) 和密保锁定 (security)

-- 添加 lock_type 列，默认值为 'password' 以兼容旧数据
ALTER TABLE account_locks 
ADD COLUMN IF NOT EXISTS lock_type VARCHAR(20) DEFAULT 'password';

-- 为现有记录设置默认类型
UPDATE account_locks 
SET lock_type = 'password' 
WHERE lock_type IS NULL;

-- 创建索引以优化按类型查询
CREATE INDEX IF NOT EXISTS idx_account_locks_lock_type 
ON account_locks (lock_type, locked_at DESC);

-- 说明:
-- lock_type = 'password': 密码错误导致的锁定
-- lock_type = 'security': 密保错误导致的锁定
-- 
-- 当密码被锁定但密保未锁定时，用户可以通过密保验证来解锁密码
-- 解锁方式是插入一条 duration_minutes = 0 的 password 类型记录

