-- User-related tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  address_line1 VARCHAR(255) NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,
  profile_picture_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Social authentication providers
CREATE TABLE IF NOT EXISTS social_auth_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon_url VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- User social authentication
CREATE TABLE IF NOT EXISTS user_social_auth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider_id INT NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES social_auth_providers(id),
  UNIQUE KEY unique_provider_user (provider_id, provider_user_id)
) ENGINE=InnoDB;

-- Authentication tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  token_type ENUM('reset_password', 'email_verification', 'refresh_token') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  seat_preference ENUM('window', 'aisle', 'middle', 'no_preference') NULL,
  meal_preference ENUM('vegetarian', 'vegan', 'non_vegetarian', 'kosher', 'halal', 'no_preference') NULL,
  notification_preferences JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Loyalty programs
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  points_expiry_months INT NULL,
  terms_and_conditions TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Loyalty tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loyalty_program_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  minimum_points INT NOT NULL,
  benefits TEXT NULL,
  FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id)
) ENGINE=InnoDB;

-- User loyalty
CREATE TABLE IF NOT EXISTS user_loyalty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  loyalty_program_id INT NOT NULL,
  loyalty_tier_id INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  membership_number VARCHAR(50) NOT NULL,
  expiry_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id),
  FOREIGN KEY (loyalty_tier_id) REFERENCES loyalty_tiers(id)
) ENGINE=InnoDB;

-- User-related tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  address_line1 VARCHAR(255) NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,
  profile_picture_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Social authentication providers
CREATE TABLE IF NOT EXISTS social_auth_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon_url VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- User social authentication
CREATE TABLE IF NOT EXISTS user_social_auth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider_id INT NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES social_auth_providers(id),
  UNIQUE KEY unique_provider_user (provider_id, provider_user_id)
) ENGINE=InnoDB;

-- Authentication tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  token_type ENUM('reset_password', 'email_verification', 'refresh_token') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  seat_preference ENUM('window', 'aisle', 'middle', 'no_preference') NULL,
  meal_preference ENUM('vegetarian', 'vegan', 'non_vegetarian', 'kosher', 'halal', 'no_preference') NULL,
  notification_preferences JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Loyalty programs
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  points_expiry_months INT NULL,
  terms_and_conditions TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Loyalty tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loyalty_program_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  minimum_points INT NOT NULL,
  benefits TEXT NULL,
  FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id)
) ENGINE=InnoDB;

-- User loyalty
CREATE TABLE IF NOT EXISTS user_loyalty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  loyalty_program_id INT NOT NULL,
  loyalty_tier_id INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  membership_number VARCHAR(50) NOT NULL,
  expiry_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id),
  FOREIGN KEY (loyalty_tier_id) REFERENCES loyalty_tiers(id)
) ENGINE=InnoDB;

