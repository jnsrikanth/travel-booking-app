-- Flight-related tables

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code CHAR(2) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

-- Airports table
CREATE TABLE IF NOT EXISTS airports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code CHAR(3) NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code CHAR(2) NOT NULL UNIQUE,
  logo_url VARCHAR(255) NULL,
  country_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

-- Aircraft table
CREATE TABLE IF NOT EXISTS aircraft (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline_id INT NOT NULL,
  model VARCHAR(100) NOT NULL,
  registration_number VARCHAR(20) NOT NULL UNIQUE,
  total_seats INT NOT NULL,
  manufacturing_year INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (airline_id) REFERENCES airlines(id)
) ENGINE=InnoDB;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
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

-- Fare classes table
CREATE TABLE IF NOT EXISTS fare_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(5) NOT NULL UNIQUE,
  description TEXT NULL,
  benefits JSON NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline_id INT NOT NULL,
  route_id INT NOT NULL,
  flight_number VARCHAR(10) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  aircraft_id INT NOT NULL,
  status ENUM('scheduled', 'delayed', 'departed', 'arrived', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (airline_id) REFERENCES airlines(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  INDEX idx_flight_date (departure_time)
) ENGINE=InnoDB;

-- Flight schedules table
CREATE TABLE IF NOT EXISTS flight_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (flight_id) REFERENCES flights(id)
) ENGINE=InnoDB;

-- Flight fares table
CREATE TABLE IF NOT EXISTS flight_fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  available_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  UNIQUE KEY unique_flight_fare_class (flight_id, fare_class_id)
) ENGINE=InnoDB;

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  available_seats INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Seat maps table
CREATE TABLE IF NOT EXISTS seat_maps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aircraft_id INT NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  seat_type ENUM('standard', 'premium', 'business', 'first_class') NOT NULL,
  fare_class_id INT NOT NULL,
  is_emergency_exit BOOLEAN DEFAULT FALSE,
  is_aisle BOOLEAN DEFAULT FALSE,
  is_window BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  UNIQUE KEY unique_aircraft_seat (aircraft_id, seat_number)
) ENGINE=InnoDB;

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NULL,
  discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  min_booking_value DECIMAL(10, 2) NULL,
  max_discount DECIMAL(10, 2) NULL,
  usage_limit INT NULL,
  current_usage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promotion_dates (start_date, end_date)
) ENGINE=InnoDB;

-- Flight-related tables

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code CHAR(2) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

-- Airports table
CREATE TABLE IF NOT EXISTS airports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code CHAR(3) NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code CHAR(2) NOT NULL UNIQUE,
  logo_url VARCHAR(255) NULL,
  country_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

-- Aircraft table
CREATE TABLE IF NOT EXISTS aircraft (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline_id INT NOT NULL,
  model VARCHAR(100) NOT NULL,
  registration_number VARCHAR(20) NOT NULL UNIQUE,
  total_seats INT NOT NULL,
  manufacturing_year INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (airline_id) REFERENCES airlines(id)
) ENGINE=InnoDB;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
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

-- Fare classes table
CREATE TABLE IF NOT EXISTS fare_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(5) NOT NULL UNIQUE,
  description TEXT NULL,
  benefits JSON NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline_id INT NOT NULL,
  route_id INT NOT NULL,
  flight_number VARCHAR(10) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  aircraft_id INT NOT NULL,
  status ENUM('scheduled', 'delayed', 'departed', 'arrived', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (airline_id) REFERENCES airlines(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  INDEX idx_flight_date (departure_time)
) ENGINE=InnoDB;

-- Flight schedules table
CREATE TABLE IF NOT EXISTS flight_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (flight_id) REFERENCES flights(id)
) ENGINE=InnoDB;

-- Flight fares table
CREATE TABLE IF NOT EXISTS flight_fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  available_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  UNIQUE KEY unique_flight_fare_class (flight_id, fare_class_id)
) ENGINE=InnoDB;

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  fare_class_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  available_seats INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id)
) ENGINE=InnoDB;

-- Seat maps table
CREATE TABLE IF NOT EXISTS seat_maps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aircraft_id INT NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  seat_type ENUM('standard', 'premium', 'business', 'first_class') NOT NULL,
  fare_class_id INT NOT NULL,
  is_emergency_exit BOOLEAN DEFAULT FALSE,
  is_aisle BOOLEAN DEFAULT FALSE,
  is_window BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  FOREIGN KEY (fare_class_id) REFERENCES fare_classes(id),
  UNIQUE KEY unique_aircraft_seat (aircraft_id, seat_number)
) ENGINE=InnoDB;

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NULL,
  discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  min_booking_value DECIMAL(10, 2) NULL,
  max_discount DECIMAL(10, 2) NULL,
  usage_limit INT NULL,
  current_usage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promotion_dates (start_date, end_date)
) ENGINE=InnoDB;

