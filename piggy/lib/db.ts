/**
 * Database Connection - 数据库连接层
 * 
 * 这个文件统一了不同环境下的数据库连接方式，提供一致的查询接口。
 * 主要功能：
 * 1. 环境适配：根据环境变量自动切换数据库客户端。
 *    - 开发环境 (Development): 使用 MySQL (mysql2)
 *    - 生产环境 (Production): 使用 Postgres/Neon (@neondatabase/serverless)
 * 2. SQL 适配：统一了参数占位符（将 Postgres 的 $1, $2 转换为 ? 或反之），让上层业务代码只需关注一种写法。
 * 3. 连接池管理：配置和导出数据库连接池。
 */

import { Pool as NeonPool } from '@neondatabase/serverless';
import mysql from 'mysql2/promise';

type QueryResult<T = any> = { rows: T[] };
type QueryParams = any[];
type QueryFn = <T = any>(sql: string, params?: QueryParams) => Promise<QueryResult<T>>;

/**
 * 统一的数据库客户端：
 * - 本地开发（默认）：MySQL
 * - 线上（默认）：Neon / Postgres
 *
 * 通过环境变量控制：
 * - DB_CLIENT = 'mysql' | 'postgres' （可显式指定）
 * - 如果未指定：development 使用 mysql，其它环境使用 postgres
 */
const DB_CLIENT =
  process.env.DB_CLIENT ||
  (process.env.NODE_ENV === 'development' ? 'mysql' : 'postgres');

let query: QueryFn;

if (DB_CLIENT === 'mysql') {
  const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
  const MYSQL_USER = process.env.MYSQL_USER || 'root';
  const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
  const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'piggy_diary';

  if (!MYSQL_PASSWORD) {
    throw new Error('MYSQL_PASSWORD environment variable is required for MySQL connection');
  }

  if (!MYSQL_DATABASE) {
    throw new Error('MySQL database name is not configured');
  }

  const rawPool = mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // MySQL 直接使用 ? 占位符
  query = async <T = any>(sql: string, params: QueryParams = []): Promise<QueryResult<T>> => {
    const [rows] = await rawPool.query(sql, params);
    return { rows: rows as T[] };
  };
} else {
  // Postgres / Neon
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pgPool = new NeonPool({
    connectionString: process.env.DATABASE_URL,
  });

  // 将统一使用的 ? 占位符转换为 $1, $2, ... 让 Postgres 可用
  function toPostgresPlaceholders(sql: string): string {
    let index = 0;
    return sql.replace(/\?/g, () => {
      index += 1;
      return `$${index}`;
    });
  }

  query = async <T = any>(sql: string, params: QueryParams = []): Promise<QueryResult<T>> => {
    const text = toPostgresPlaceholders(sql);
    const result = await pgPool.query(text, params);
    return { rows: result.rows as T[] };
  };
}

const pool = { query };

export default pool;

