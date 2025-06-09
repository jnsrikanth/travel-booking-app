// src/lib/db.ts
const mysql = require('mysql2/promise'); // Revert to require for runtime
// Import types that are generally stable and used for return/param types
import { RowDataPacket, OkPacket, ResultSetHeader, FieldPacket, QueryOptions } from 'mysql2';

let pool: any = null; // Use 'any' for the pool to bypass persistent type issues

function getPool(): any { // Return 'any'
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'airline_booking',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  }
  return pool;
}

// Define a more explicit type for what a promise-based connection should look like for consumers
interface PromiseConnection {
  query<T extends RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader>(
    sql: string, options?: any[]
  ): Promise<[T, FieldPacket[]]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export async function getConnection(): Promise<PromiseConnection> {
  const p = getPool();
  const conn = await p.getConnection();
  return conn as PromiseConnection; // Cast to our defined interface
}

export async function executeQuery<T extends RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader>(
  sql: string,
  params?: any[]
): Promise<T> {
  const connection = await getConnection();
  try {
    const [results] = await connection.query<T>(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  getPool, // Consumers might still use this if they know it's 'any'
  closePool,
  executeQuery,
  getConnection,
};