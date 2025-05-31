-- Booking-related tables

-- Booking status table
CREATE TABLE IF NOT EXISTS booking_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NULL
) ENGINE=InnoDB;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_reference VARCHAR(10) NOT NULL UNIQUE,
  status_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (status_id) REFERENCES booking_status(id),
  INDEX idx_booking_reference (booking_reference)
) ENGINE=InnoDB;

-- Booking status history table
CREATE TABLE IF NOT EXISTS booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status_id INT NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by INT NULL,
  notes TEXT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES booking_status(id),
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Booking flights table
CREATE TABLE IF NOT EXISTS booking_flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  passport_number VARCHAR(20) NULL,
  passport_expiry DATE NULL,
  nationality VARCHAR(100) NULL,
  passenger_type ENUM('adult', 'child', 'infant') NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Passenger seats table
CREATE TABLE IF NOT EXISTS passenger_seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  booking_flight_id INT NOT NULL,
  seat_map_id INT NOT NULL,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_flight_id) REFERENCES booking_flights(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_map_id) REFERENCES seat_maps(id),
  UNIQUE KEY unique_booking_flight_seat (booking_flight_id, seat_map_id)
) ENGINE=InnoDB;

-- Baggage table
CREATE TABLE IF NOT EXISTS baggage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  booking_flight_id INT NOT NULL,
  baggage_type ENUM('checked', 'cabin') NOT NULL,
  weight_kg DECIMAL(5, 2) NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_flight_id) REFERENCES booking_flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gateway_response TEXT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'processed', 'rejected') NOT NULL,
  refund_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_by INT NULL,
  transaction_id VARCHAR(100) NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- User saved trips table
CREATE TABLE IF NOT EXISTS user_saved_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  origin_airport_id INT NOT NULL,
  destination_airport_id INT NOT NULL,
  departure_date DATE NULL,
  return_date DATE NULL,
  passengers INT NOT NULL DEFAULT 1,
  fare_class_id INT NULL,
  name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
  FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  origin_airport_id INT NOT NULL,
  destination_airport_id INT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NULL,
  passengers INT NOT NULL DEFAULT 1,
  fare_class_id INT NULL,
  search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(100) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
  FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  INDEX idx_search_date (search_date)
) ENGINE=InnoDB;

-- Booking-related tables

-- Booking status table
CREATE TABLE IF NOT EXISTS booking_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NULL
) ENGINE=InnoDB;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_reference VARCHAR(10) NOT NULL UNIQUE,
  status_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (status_id) REFERENCES booking_status(id),
  INDEX idx_booking_reference (booking_reference)
) ENGINE=InnoDB;

-- Booking status history table
CREATE TABLE IF NOT EXISTS booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status_id INT NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by INT NULL,
  notes TEXT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES booking_status(id),
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Booking flights table
CREATE TABLE IF NOT EXISTS booking_flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  passport_number VARCHAR(20) NULL,
  passport_expiry DATE NULL,
  nationality VARCHAR(100) NULL,
  passenger_type ENUM('adult', 'child', 'infant') NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Passenger seats table
CREATE TABLE IF NOT EXISTS passenger_seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  booking_flight_id INT NOT NULL,
  seat_map_id INT NOT NULL,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_flight_id) REFERENCES booking_flights(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_map_id) REFERENCES seat_maps(id),
  UNIQUE KEY unique_booking_flight_seat (booking_flight_id, seat_map_id)
) ENGINE=InnoDB;

-- Baggage table
CREATE TABLE IF NOT EXISTS baggage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  booking_flight_id INT NOT NULL,
  baggage_type ENUM('checked', 'cabin') NOT NULL,
  weight_kg DECIMAL(5, 2) NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_flight_id) REFERENCES booking_flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gateway_response TEXT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'processed', 'rejected') NOT NULL,
  refund_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_by INT NULL,
  transaction_id VARCHAR(100) NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- User saved trips table
CREATE TABLE IF NOT EXISTS user_saved_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  origin_airport_id INT NOT NULL,
  destination_airport_id INT NOT NULL,
  departure_date DATE NULL,
  return_date DATE NULL,
  passengers INT NOT NULL DEFAULT 1,
  fare_class_id INT NULL,
  name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
  FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  origin_airport_id INT NOT NULL,
  destination_airport_id INT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NULL,
  passengers INT NOT NULL DEFAULT 1,
  fare_class_id INT NULL,
  search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(100) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
  FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  INDEX idx_search_date (search_date)
) ENGINE=InnoDB;

