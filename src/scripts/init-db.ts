// Use require instead of import for scripts
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

/**
 * Database initialization script
 * Creates database, tables, indexes, and stored procedures
 * Can be run multiple times safely (idempotent)
 */
async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  // Get environment variables
  const {
    MYSQL_HOST = 'localhost',
    MYSQL_PORT = '3306',
    MYSQL_USER = 'root',
    MYSQL_PASSWORD = '',
    MYSQL_DATABASE = 'airline_booking',
  } = process.env;
  
  try {
    // First connect without database to create it if needed
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      multipleStatements: true,
    });
    
    console.log('Connected to MySQL server');
    
    // Check if database exists, create if not
    const [dbResults] = await connection.query(`
      SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [MYSQL_DATABASE]);
    
    const dbExists = Array.isArray(dbResults) && dbResults.length > 0;
    
    if (!dbExists) {
      console.log(`Database '${MYSQL_DATABASE}' does not exist. Creating...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Database '${MYSQL_DATABASE}' created successfully`);
    } else {
      console.log(`Database '${MYSQL_DATABASE}' already exists`);
    }
    
    // Close initial connection
    await connection.end();
    
    // Now connect with the pool to the specific database
    const pool = db.getPool();
    console.log(`Connected to database '${MYSQL_DATABASE}'`);
    
    // Load and execute schema files in order
    const schemaDir = path.join(__dirname, 'schema');
    const schemaFiles = [
      '01_user_tables.sql',
      '02_flight_tables.sql',
      '03_booking_tables.sql',
      '04_system_tables.sql',
      '05_indexes.sql',
      '06_stored_procedures.sql',
      '07_triggers.sql',
    ];
    
    for (const file of schemaFiles) {
      const filePath = path.join(schemaDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`Executing schema file: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split the SQL by delimiter to handle stored procedures and triggers
        const statements = sql.split(';').filter((stmt: string) => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await pool.query(statement);
            } catch (error: any) {
              // Skip errors for existing objects
              if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                  error.code === 'ER_DUP_KEYNAME' ||
                  error.code === 'ER_SP_ALREADY_EXISTS' ||
                  error.code === 'ER_TRG_ALREADY_EXISTS') {
                console.log(`  - Object already exists, skipping...`);
              } else {
                console.error(`Error executing statement: ${error.message}`);
                console.error(statement);
                throw error;
              }
            }
          }
        }
        
        console.log(`  - Successfully executed ${file}`);
      } else {
        console.warn(`Schema file not found: ${file}`);
      }
    }
    
    console.log('Database initialization completed successfully');
    
    // Close the connection pool
    await db.closePool();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();


export {};
