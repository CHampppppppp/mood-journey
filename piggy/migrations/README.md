# 数据库 Migrations

本目录包含数据库结构变更的 SQL migrations，按顺序执行以同步数据库结构。

## Migration 文件列表

- `000_initial_schema.sql` - **MySQL 版本**：初始数据库结构（moods, periods, account_locks, login_logs）
- `000_initial_schema.postgres.sql` - **PostgreSQL 版本**：初始数据库结构（同上）

## 使用方法

### MySQL

```bash
# 方式1：使用 mysql 命令行
mysql -u root -p piggy_diary < migrations/000_initial_schema.sql

# 方式2：在 mysql 客户端中
mysql> USE piggy_diary;
mysql> SOURCE migrations/000_initial_schema.sql;
```

### PostgreSQL

```bash
# 方式1：使用 psql 命令行
psql -d your_database -f migrations/000_initial_schema.postgres.sql

# 方式2：在 psql 客户端中
psql> \i migrations/000_initial_schema.postgres.sql

# 方式3：直接复制 SQL 内容到 psql
psql> -- 粘贴 000_initial_schema.postgres.sql 的内容
```

## 数据库差异说明

### MySQL vs PostgreSQL 主要差异

| 特性 | MySQL | PostgreSQL |
|------|-------|------------|
| 自增主键 | `AUTO_INCREMENT` | `SERIAL` / `BIGSERIAL` |
| 无符号整数 | `bigint unsigned` | `bigint` (不支持 unsigned) |
| 小整数 | `tinyint` | `smallint` |
| 日期时间 | `datetime` / `timestamp` | `timestamp` |
| 列注释 | `COMMENT '...'` | `COMMENT ON COLUMN ...` |
| 索引 IF NOT EXISTS | 5.7.4+ 支持 | 9.5+ 支持 |

### 当前数据库结构

根据最新检查，数据库包含以下表：

- **moods** - 心情记录
  - `id` (bigint/bigserial), `mood` (varchar), `intensity` (tinyint/smallint), `note` (text), `created_at` (timestamp), `date_key` (varchar)
  
- **periods** - 经期记录
  - `id` (bigint/bigserial), `start_date` (date), `created_at` (timestamp)
  
- **account_locks** - 账号锁定
  - `id` (bigint/bigserial), `locked_at` (datetime/timestamp), `duration_minutes` (int), `reason` (varchar), `lock_type` (varchar)
  
- **login_logs** - 登录日志
  - `id` (int/serial), `logged_in_at` (timestamp), `user_agent` (text), `ip_address` (varchar)

## 注意事项

1. **执行顺序**：必须按文件名顺序执行 migrations
2. **幂等性**：使用了 `IF NOT EXISTS`，可以安全地重复执行
3. **数据库类型**：根据你的数据库类型（MySQL 或 PostgreSQL）选择对应的 migration 文件
4. **索引创建**：如果索引已存在，PostgreSQL 会忽略，MySQL 会报错（可以忽略）

## 项目配置

项目通过 `DB_CLIENT` 环境变量自动选择数据库类型：

```env
# MySQL（本地开发）
DB_CLIENT=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=piggy_diary

# PostgreSQL（生产环境，如 Neon）
DB_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
```

默认情况下：
- `NODE_ENV=development` → 使用 MySQL
- 其他环境 → 使用 PostgreSQL

