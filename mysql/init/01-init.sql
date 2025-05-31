-- Travel Booking App Database Schema

-- Ensure we're using the correct database
USE travel_booking;

-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  passport_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Flight searches table to track search history
CREATE TABLE IF NOT EXISTS flight_searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  origin_code VARCHAR(10) NOT NULL,
  destination_code VARCHAR(10) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  infants INT NOT NULL DEFAULT 0,
  travel_class VARCHAR(20) DEFAULT 'ECONOMY',
  search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  search_results_count INT,
  is_mock_data BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_search_route (origin_code, destination_code),
  INDEX idx_search_date (departure_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Passengers table to store passenger details
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE NOT NULL,
  passport_number VARCHAR(50),
  passport_expiry DATE,
  nationality VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_passenger_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Flights table to store flight information
CREATE TABLE IF NOT EXISTS flights (
  id VARCHAR(50) PRIMARY KEY,
  airline VARCHAR(100) NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  origin_code VARCHAR(10) NOT NULL,
  origin_name VARCHAR(100) NOT NULL,
  origin_city VARCHAR(100),
  origin_country VARCHAR(100),
  destination_code VARCHAR(10) NOT NULL,
  destination_name VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100),
  destination_country VARCHAR(100),
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL,
  price_economy INT,
  price_business INT,
  price_first INT,
  available_seats INT,
  is_mock_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_flight_route (origin_code, destination_code),
  INDEX idx_flight_date (departure_date),
  INDEX idx_flight_number (flight_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table to store flight booking information
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(20) PRIMARY KEY,
  user_id INT,
  flight_id VARCHAR(50) NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  travel_class VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
  total_passengers INT NOT NULL DEFAULT 1,
  total_price INT NOT NULL,
  booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
  payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') DEFAULT 'PENDING',
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
  INDEX idx_booking_status (booking_status),
  INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Booking passengers junction table to link bookings with passengers
CREATE TABLE IF NOT EXISTS booking_passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(20) NOT NULL,
  passenger_id INT NOT NULL,
  seat_number VARCHAR(10),
  special_requests TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  UNIQUE KEY uk_booking_passenger (booking_id, passenger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table to store payment information
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a sample user for testing
INSERT INTO users (email, password_hash, first_name, last_name, phone) 
VALUES ('test@example.com', '$2b$10$XfRupQaK9qPgYsXvgOV75e4gT8cQTODJhoGDVbj0Ovj8S7UURmogC', 'Test', 'User', '+1234567890');

