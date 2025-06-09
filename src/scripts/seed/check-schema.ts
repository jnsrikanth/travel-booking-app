/**
 * Database Schema Validation Script
 * 
 * This script checks the database schema and creates missing tables:
 * - Validates existence of all required tables
 * - Creates any missing tables with proper schema
 * - Ensures foreign key constraints and indexes are in place
 */

import dbUtils from '../../lib/db'; // Use default import
import chalk from 'chalk';

// Initialize the DB connection
const { getPool, executeQuery, closePool } = dbUtils; // Destructure needed functions
const pool = getPool(); // This pool is 'any' as per db.ts, direct usage might be fine or need casting

// Logging utility
const log = {
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message: string) => console.log(chalk.red(`[ERROR] ${message}`)),
  step: (message: string) => console.log(chalk.cyan(`\n[STEP] ${message}`)),
};

/**
 * Main schema validation function
 */
async function validateDatabaseSchema() {
  try {
    log.step('Starting database schema validation');
    
    // Check database connection
    await checkDatabaseConnection();
    
    // Validate core entities
    await validateCoreEntities();
    
    // Validate booking-related tables
    await validateBookingTables();
    
    // Validate system tables
    await validateSystemTables();
    
    log.success('Database schema validation completed successfully');
    
    // Close pool using the utility from db.ts
    await closePool();
    
  } catch (error) {
    log.error(`Database schema validation failed: ${error}`);
    
    // Close pool even if there's an error
    try {
      await closePool(); // Use the utility here as well
    } catch (err) {
      log.error(`Failed to close database pool: ${err}`);
    }
    
    process.exit(1);
  }
}

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    log.info('Checking database connection...');
    await executeQuery('SELECT 1');
    log.success('Database connection successful');
  } catch (error) {
    log.error(`Database connection failed: ${error}`);
    throw error;
  }
}

/**
 * Check if a table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      [tableName]
    );
    return result[0].count > 0;
  } catch (error) {
    log.error(`Error checking if table ${tableName} exists: ${error}`);
    throw error;
  }
}

/**
 * Validate core entity tables
 */
async function validateCoreEntities() {
  log.step('Validating core entity tables');
  
  // Check countries table
  if (!await tableExists('countries')) {
    log.info('Creating countries table...');
    await executeQuery(`
      CREATE TABLE countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code CHAR(2) NOT NULL UNIQUE
      ) ENGINE=InnoDB;
    `);
    log.success('Created countries table');
  }
  
  // Check cities table
  if (!await tableExists('cities')) {
    log.info('Creating cities table...');
    await executeQuery(`
      CREATE TABLE cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        country_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        is_major BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (country_id) REFERENCES countries(id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created cities table');
  }
  
  // Check airports table
  if (!await tableExists('airports')) {
    log.info('Creating airports table...');
    await executeQuery(`
      CREATE TABLE airports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        city_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        code CHAR(3) NOT NULL UNIQUE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        is_international BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (city_id) REFERENCES cities(id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created airports table');
  }
  
  // Check airlines table
  if (!await tableExists('airlines')) {
    log.info('Creating airlines table...');
    await executeQuery(`
      CREATE TABLE airlines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code CHAR(2) NOT NULL UNIQUE,
        logo_url VARCHAR(255) NULL,
        country_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (country_id) REFERENCES countries(id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created airlines table');
  }
  
  // Check aircraft table
  if (!await tableExists('aircraft')) {
    log.info('Creating aircraft table...');
    await executeQuery(`
      CREATE TABLE aircraft (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model VARCHAR(100) NOT NULL,
        manufacturer VARCHAR(100) NOT NULL,
        capacity_economy INT NOT NULL,
        capacity_business INT NOT NULL,
        capacity_first INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB;
    `);
    log.success('Created aircraft table');
  }
  
  // Check routes table
  if (!await tableExists('routes')) {
    log.info('Creating routes table...');
    await executeQuery(`
      CREATE TABLE routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        origin_airport_id INT NOT NULL,
        destination_airport_id INT NOT NULL,
        distance_km DECIMAL(10, 2) NOT NULL,
        flight_time_minutes INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
        FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
        UNIQUE KEY unique_route (origin_airport_id, destination_airport_id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created routes table');
  }
  
  // Check users table
  if (!await tableExists('users')) {
    log.info('Creating users table...');
    await executeQuery(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_number VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      ) ENGINE=InnoDB;
    `);
    log.success('Created users table');
  }
  
  // Check user_profiles table
  if (!await tableExists('user_profiles')) {
    log.info('Creating user_profiles table...');
    await executeQuery(`
      CREATE TABLE user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NULL,
        gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
        address_line1 VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        postal_code VARCHAR(20) NULL,
        country VARCHAR(100) NULL,
        preferred_language VARCHAR(10) DEFAULT 'en',
        profile_image VARCHAR(255) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    log.success('Created user_profiles table');
  }
  
  // Check flights table
  if (!await tableExists('flights')) {
    log.info('Creating flights table...');
    await executeQuery(`
      CREATE TABLE flights (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flight_number VARCHAR(10) NOT NULL,
        airline_id INT NOT NULL,
        route_id INT NOT NULL,
        aircraft_id INT NOT NULL,
        departure_time DATETIME NOT NULL,
        arrival_time DATETIME NOT NULL,
        status ENUM('scheduled', 'delayed', 'departed', 'arrived', 'cancelled') NOT NULL DEFAULT 'scheduled',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (airline_id) REFERENCES airlines(id),
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
        INDEX idx_flight_date (departure_time)
      ) ENGINE=InnoDB;
    `);
    log.success('Created flights table');
  }
  
  // Check fare_classes table
  if (!await tableExists('fare_classes')) {
    log.info('Creating fare_classes table...');
    await executeQuery(`
      CREATE TABLE fare_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        class_type ENUM('economy', 'business', 'first') NOT NULL,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB;
    `);
    log.success('Created fare_classes table');
  }
  
  // Check flight_fares table
  if (!await tableExists('flight_fares')) {
    log.info('Creating flight_fares table...');
    await executeQuery(`
      CREATE TABLE flight_fares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flight_id INT NOT NULL,
        fare_class_id INT NOT NULL,
        base_price DECIMAL(10, 2) NOT NULL,
        available_seats INT NOT NULL,
        is_refundable BOOLEAN DEFAULT FALSE,
        is_changeable BOOLEAN DEFAULT FALSE,
        change_fee DECIMAL(10, 2) NULL,
        cancellation_fee DECIMAL(10, 2) NULL,
        baggage_allowance_kg INT DEFAULT 15,
        meal_service BOOLEAN DEFAULT FALSE,
        seat_selection BOOLEAN DEFAULT FALSE,
        priority_boarding BOOLEAN DEFAULT FALSE,
        lounge_access BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
        FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
        UNIQUE KEY unique_flight_fare (flight_id, fare_class_id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created flight_fares table');
  }
  
  log.success('Core entity tables validation completed');
}

/**
 * Validate booking-related tables
 */
async function validateBookingTables() {
  log.step('Validating booking-related tables');
  
  // Check booking_status table
  if (!await tableExists('booking_status')) {
    log.info('Creating booking_status table...');
    await executeQuery(`
      CREATE TABLE booking_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT NULL
      ) ENGINE=InnoDB;
    `);
    log.success('Created booking_status table');
    
    // Insert default booking statuses
    await executeQuery(`
      INSERT INTO booking_status (name, description) VALUES
      ('confirmed', 'Booking is confirmed'),
      ('pending', 'Payment is pending'),
      ('cancelled', 'Booking has been cancelled'),
      ('refunded', 'Booking has been refunded'),
      ('completed', 'Travel has been completed');
    `);
    log.success('Inserted default booking statuses');
  }
  
  // Check bookings table
  if (!await tableExists('bookings')) {
    log.info('Creating bookings table...');
    await executeQuery(`
      CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reference VARCHAR(10) NOT NULL UNIQUE,
        status_id INT NOT NULL,
        booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10, 2) NOT NULL,
        currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20) NOT NULL,
        notes TEXT NULL,
        is_round_trip BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (status_id) REFERENCES booking_status(id),
        INDEX idx_booking_reference (reference)
      ) ENGINE=InnoDB;
    `);
    log.success('Created bookings table');
  }
  
  // Check booking_flights table
  if (!await tableExists('booking_flights')) {
    log.info('Creating booking_flights table...');
    await executeQuery(`
      CREATE TABLE booking_flights (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        flight_id INT NOT NULL,
        fare_id INT NOT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (flight_id) REFERENCES flights(id),
        FOREIGN KEY (fare_id) REFERENCES flight_fares(id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created booking_flights table');
  }
  
  // Check passengers table
  if (!await tableExists('passengers')) {
    log.info('Creating passengers table...');
    await executeQuery(`
      CREATE TABLE passengers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NULL,
        nationality VARCHAR(100) NULL,
        passport_number VARCHAR(20) NULL,
        passport_expiry DATE NULL,
        phone_number VARCHAR(20) NULL,
        email VARCHAR(255) NULL,
        is_main_passenger BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    log.success('Created passengers table');
  }
  
  // Check passenger_seats table
  if (!await tableExists('passenger_seats')) {
    log.info('Creating passenger_seats table...');
    await executeQuery(`
      CREATE TABLE passenger_seats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        passenger_id INT NOT NULL,
        flight_id INT NOT NULL,
        seat_number VARCHAR(5) NOT NULL,
        seat_type ENUM('economy', 'business', 'first') NOT NULL,
        is_emergency_exit BOOLEAN DEFAULT FALSE,
        is_aisle BOOLEAN DEFAULT FALSE,
        is_window BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
        FOREIGN KEY (flight_id) REFERENCES flights(id),
        UNIQUE KEY unique_flight_seat (flight_id, seat_number)
      ) ENGINE=InnoDB;
    `);
    log.success('Created passenger_seats table');
  }
  
  // Check payment_methods table
  if (!await tableExists('payment_methods')) {
    log.info('Creating payment_methods table...');
    await executeQuery(`
      CREATE TABLE payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT NULL,
        is_card_based BOOLEAN DEFAULT FALSE,
        processing_fee_percentage DECIMAL(5, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB;
    `);
    log.success('Created payment_methods table');
  }
  
  // Check payments table
  if (!await tableExists('payments')) {
    log.info('Creating payments table...');
    await executeQuery(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        payment_method_id INT NOT NULL,
        transaction_id VARCHAR(100) NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
        status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL,
        payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        gateway_response TEXT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
      ) ENGINE=InnoDB;
    `);
    log.success('Created payments table');
  }
  
  log.success('Booking-related tables validation completed');
}

/**
 * Validate system tables
 */
async function validateSystemTables() {
  log.step('Validating system tables');
  
  // Check currencies table
  if (!await tableExists('currencies')) {
    log.info('Creating currencies table...');
    await executeQuery(`
      CREATE TABLE currencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(3) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        symbol VARCHAR(5) NOT NULL,
        exchange_rate_to_usd DECIMAL(10, 6) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    log.success('Created currencies table');
  }
  
  // Check system_settings table
  if (!await tableExists('system_settings')) {
    log.info('Creating system_settings table...');
    await executeQuery(`
      CREATE TABLE system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    log.success('Created system_settings table');
  }
  
  // Check flight_schedules table
  if (!await tableExists('flight_schedules')) {
    log.info('Creating flight_schedules table...');
    await executeQuery(`
      CREATE TABLE flight_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flight_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        departure_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    log.success('Created flight_schedules table');
  }
  
  log.success('System tables validation completed');
}

// Run the database schema validation
validateDatabaseSchema()
  .then(() => {
    log.success('Database schema validation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    log.error(`Database schema validation failed: ${error}`);
    process.exit(1);
  });

