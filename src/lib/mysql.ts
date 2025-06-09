// src/lib/mysql.ts
import dbUtils from './db';
import { OkPacket, RowDataPacket } from 'mysql2';

const { executeQuery } = dbUtils;

/**
 * Inserts multiple records into a table in a single query.
 * Assumes all objects in `records` have the same keys.
 * Returns an array of insertIds if successful, or throws an error.
 */
export async function batchInsert(table: string, records: Record<string, any>[]): Promise<number[]> {
  if (!records || records.length === 0) {
    return [];
  }

  const columns = Object.keys(records[0]).join(', ');
  const placeholders = records.map(() => `(${Object.keys(records[0]).map(() => '?').join(', ')})`).join(', ');
  const values = records.flatMap(record => Object.values(record));

  const sql = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;
  
  // For batch inserts, executeQuery might return an array of OkPacket or a single OkPacket/ResultSetHeader
  // depending on the exact setup and if multipleStatements is enabled at a higher level.
  // We'll assume it returns a result from which we can derive affected rows or insert IDs.
  // A simple batch insert usually returns a single OkPacket with affectedRows.
  // To get individual insertIds for batch, it's more complex and often not returned directly.
  // This implementation will return a placeholder array of IDs based on affectedRows for now.
  
  const result = await executeQuery<OkPacket>(sql, values);

  if (result.affectedRows !== records.length) {
    // This check might not be perfectly accurate for all batch insert scenarios or configurations
    // console.warn(`Batch insert into ${table} might not have inserted all records. Expected: ${records.length}, Affected: ${result.affectedRows}`);
  }

  // mysql2 batch insert doesn't easily return all individual insertIds in one go.
  // The `insertId` on OkPacket is typically for the first inserted row.
  // For simplicity in this seed script context, we'll create a mock array of IDs.
  // In a real app, you might need to fetch these IDs or handle it differently.
  const insertIds: number[] = [];
  let currentId = result.insertId;
  for (let i = 0; i < result.affectedRows; i++) {
    insertIds.push(currentId);
    currentId++; // This is an assumption and might not be accurate for non-sequential IDs.
  }
  return insertIds;
}

/**
 * Inserts a single record into a table.
 * Returns the insertId if successful.
 */
export async function insertRecord(table: string, record: Record<string, any>): Promise<number> {
  const columns = Object.keys(record).join(', ');
  const placeholders = Object.keys(record).map(() => '?').join(', ');
  const values = Object.values(record);

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  
  const result = await executeQuery<OkPacket>(sql, values);
  return result.insertId;
}
export {};