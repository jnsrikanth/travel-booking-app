// Use require instead of import for scripts
const mysql = require('mysql2/promise');
const db = require('../lib/db');
const { closePool } = db;

/**
 * Database reset script
 * WARNING: This will delete all data in the database!
 */
async function resetDatabase() {
  console.log('Starting database reset...');
  console.log('WARNING: This will delete all data in the database!');
  
  // Get environment variables
  const {
    MYSQL_HOST = 'localhost',
    MYSQL_PORT = '3306',
    MYSQL_USER = 'root',
    MYSQL_PASSWORD = '',
    MYSQL_DATABASE = 'airline_booking',
  } = process.env;
  
  // Confirm reset is intended in a production environment
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CONFIRM_DB_RESET !== 'yes') {
      console.error('Database reset aborted: To reset in production, set CONFIRM_DB_RESET=yes');
      process.exit(1);
    }
    console.log('PRODUCTION ENVIRONMENT DETECTED! Proceeding with reset as CONFIRM_DB_RESET=yes');
  }
  
  try {
    // Create a connection
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      multipleStatements: true,
    });
    
    console.log(`Connected to MySQL server`);
    
    // Drop the database if it exists
    await connection.query(`DROP DATABASE IF EXISTS ${MYSQL_DATABASE}`);
    console.log(`Database '${MYSQL_DATABASE}' has been dropped`);
    
    // Create a new empty database
    await connection.query(`CREATE DATABASE ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Empty database '${MYSQL_DATABASE}' has been created`);
    
    // Close the connection
    await connection.end();
    
    console.log('Database reset completed successfully');
    console.log('Run "npm run db:init" to initialize the database schema');
    console.log('Run "npm run db:seed" to populate the database with initial data');
    
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the reset
resetDatabase();


export {};
