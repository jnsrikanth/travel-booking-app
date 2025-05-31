-- SkyJourney Airline Booking Application Database Schema
-- Comprehensive schema with user management, flight information, bookings, pricing, and audit trails

-- Enable strict mode and UTF-8 character set
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO,STRICT_ALL_TABLES";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- -----------------------------------------------------
-- Database skyjourney_db
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `skyjourney_db` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `skyjourney_db`;

-- -----------------------------------------------------
-- Table `users`
-- Core user account information
-- -----------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `phone_number` VARCHAR(20) NULL,
  `password_hash` VARCHAR(255) NULL COMMENT 'Securely hashed password using bcrypt or Argon2',
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_phone_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'pending',
  `role` ENUM('user', 'admin', 'support') NOT NULL DEFAULT 'user',
  `login_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_login_at` DATETIME NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_users_email` (`email`),
  UNIQUE INDEX `idx_users_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_profiles`
-- Detailed user information
-- -----------------------------------------------------
CREATE TABLE `user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  `date_of_birth` DATE NULL,
  `nationality` VARCHAR(100) NULL,
  `passport_number` VARCHAR(50) NULL,
  `passport_expiry` DATE NULL,
  `address_line1` VARCHAR(255) NULL,
  `address_line2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `postal_code` VARCHAR(20) NULL,
  `country` VARCHAR(100) NULL,
  `profile_picture` VARCHAR(255) NULL,
  `emergency_contact_name` VARCHAR(200) NULL,
  `emergency_contact_phone` VARCHAR(20) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `social_auth_providers`
-- -----------------------------------------------------
CREATE TABLE `social_auth_providers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_social_auth_providers_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert standard providers
INSERT INTO `social_auth_providers` (`name`) VALUES ('Google'), ('Apple');

-- -----------------------------------------------------
-- Table `user_social_auth`
-- -----------------------------------------------------
CREATE TABLE `user_social_auth` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `provider_id` BIGINT UNSIGNED NOT NULL,
  `provider_user_id` VARCHAR(255) NOT NULL,
  `provider_email` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_social_auth_provider` (`provider_id`, `provider_user_id`),
  INDEX `idx_user_social_auth_user_id` (`user_id`),
  CONSTRAINT `fk_user_social_auth_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_social_auth_providers`
    FOREIGN KEY (`provider_id`)
    REFERENCES `social_auth_providers` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `auth_tokens`
-- -----------------------------------------------------
CREATE TABLE `auth_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `token_type` ENUM('refresh', 'reset_password', 'email_verification', 'phone_verification') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_auth_tokens_user_id` (`user_id`),
  INDEX `idx_auth_tokens_token_hash` (`token_hash`),
  CONSTRAINT `fk_auth_tokens_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_preferences`
-- -----------------------------------------------------
CREATE TABLE `user_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `meal_preference` ENUM('regular', 'vegetarian', 'vegan', 'kosher', 'halal', 'diabetic', 'gluten_free', 'low_sodium', 'low_calorie') NULL,
  `seat_preference` ENUM('window', 'aisle', 'middle', 'no_preference') NULL,
  `notification_email` TINYINT(1) NOT NULL DEFAULT 1,
  `notification_sms` TINYINT(1) NOT NULL DEFAULT 1,
  `notification_push` TINYINT(1) NOT NULL DEFAULT 1,
  `newsletter_subscription` TINYINT(1) NOT NULL DEFAULT 0,
  `currency_code` CHAR(3) NOT NULL DEFAULT 'INR',
  `language_code` VARCHAR(10) NOT NULL DEFAULT 'en-IN',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_preferences_user_id` (`user_id`),
  CONSTRAINT `fk_user_preferences_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `loyalty_programs`
-- -----------------------------------------------------
CREATE TABLE `loyalty_programs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `loyalty_tiers`
-- -----------------------------------------------------
CREATE TABLE `loyalty_tiers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `program_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `min_points` INT UNSIGNED NOT NULL,
  `benefits` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_loyalty_tiers_program_id` (`program_id`),
  CONSTRAINT `fk_loyalty_tiers_programs`
    FOREIGN KEY (`program_id`)
    REFERENCES `loyalty_programs` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_loyalty`
-- -----------------------------------------------------
CREATE TABLE `user_loyalty` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `program_id` BIGINT UNSIGNED NOT NULL,
  `tier_id` BIGINT UNSIGNED NOT NULL,
  `points_balance` INT UNSIGNED NOT NULL DEFAULT 0,
  `lifetime_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `member_since` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_loyalty_user_program` (`user_id`, `program_id`),
  INDEX `idx_user_loyalty_program_id` (`program_id`),
  INDEX `idx_user_loyalty_tier_id` (`tier_id`),
  CONSTRAINT `fk_user_loyalty_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_loyalty_programs`
    FOREIGN KEY (`program_id`)
    REFERENCES `loyalty_programs` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_loyalty_tiers`
    FOREIGN KEY (`tier_id`)
    REFERENCES `loyalty_tiers` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `countries`
-- -----------------------------------------------------
CREATE TABLE `countries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` CHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone_code` VARCHAR(10) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_countries_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `cities`
-- -----------------------------------------------------
CREATE TABLE `cities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `country_id` BIGINT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_cities_country_id` (`country_id`),
  CONSTRAINT `fk_cities_countries`
    FOREIGN KEY (`country_id`)
    REFERENCES `countries` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `airports`
-- -----------------------------------------------------
CREATE TABLE `airports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` CHAR(3) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `city_id` BIGINT UNSIGNED NOT NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `timezone` VARCHAR(50) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_airports_code` (`code`),
  INDEX `idx_airports_city_id` (`city_id`),
  CONSTRAINT `fk_airports_cities`
    FOREIGN KEY (`city_id`)
    REFERENCES `cities` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `airlines`
-- -----------------------------------------------------
CREATE TABLE `airlines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` CHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `country_id` BIGINT UNSIGNED NOT NULL,
  `logo_url` VARCHAR(255) NULL,
  `website` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_airlines_code` (`code`),
  INDEX `idx_airlines_country_id` (`country_id`),
  CONSTRAINT `fk_airlines_countries`
    FOREIGN KEY (`country_id`)
    REFERENCES `countries` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `aircraft`
-- -----------------------------------------------------
CREATE TABLE `aircraft` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `airline_id` BIGINT UNSIGNED NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `registration` VARCHAR(20) NOT NULL,
  `seat_capacity` INT UNSIGNED NOT NULL,
  `manufactured_year` YEAR NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_aircraft_airline_id` (`airline_id`),
  CONSTRAINT `fk_aircraft_airlines`
    FOREIGN KEY (`airline_id`)
    REFERENCES `airlines` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `routes`
-- -----------------------------------------------------
CREATE TABLE `routes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `origin_airport_id` BIGINT UNSIGNED NOT NULL,
  `destination_airport_id` BIGINT UNSIGNED NOT NULL,
  `distance_km` INT UNSIGNED NULL,
  `duration_minutes` INT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_routes_origin_destination` (`origin_airport_id`, `destination_airport_id`),
  INDEX `idx_routes_destination` (`destination_airport_id`),
  CONSTRAINT `fk_routes_origin_airports`
    FOREIGN KEY (`origin_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_routes_destination_airports`
    FOREIGN KEY (`destination_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `fare_classes`
-- -----------------------------------------------------
CREATE TABLE `fare_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `airline_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `cabin_class` ENUM('economy', 'premium_economy', 'business', 'first') NOT NULL,
  `benefits` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fare_classes_airline_id` (`airline_id`),
  CONSTRAINT `fk_fare_classes_airlines`
    FOREIGN KEY (`airline_id`)
    REFERENCES `airlines` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `flights`
-- -----------------------------------------------------
CREATE TABLE `flights` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `airline_id` BIGINT UNSIGNED NOT NULL,
  `flight_number` VARCHAR(10) NOT NULL,
  `route_id` BIGINT UNSIGNED NOT NULL,
  `aircraft_id` BIGINT UNSIGNED NOT NULL,
  `departure_time` TIME NOT NULL,
  `arrival_time` TIME NOT NULL,
  `duration_minutes` INT UNSIGNED NOT NULL,
  `distance_km` INT UNSIGNED NULL,
  `monday` TINYINT(1) NOT NULL DEFAULT 0,
  `tuesday` TINYINT(1) NOT NULL DEFAULT 0,
  `wednesday` TINYINT(1) NOT NULL DEFAULT 0,
  `thursday` TINYINT(1) NOT NULL DEFAULT 0,
  `friday` TINYINT(1) NOT NULL DEFAULT 0,
  `saturday` TINYINT(1) NOT NULL DEFAULT 0,
  `sunday` TINYINT(1) NOT NULL DEFAULT 0,
  `effective_from` DATE NOT NULL,
  `effective_to` DATE NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_flights_number_route` (`airline_id`, `flight_number`, `route_id`),
  INDEX `idx_flights_route_id` (`route_id`),
  INDEX `idx_flights_aircraft_id` (`aircraft_id`),
  CONSTRAINT `fk_flights_airlines`
    FOREIGN KEY (`airline_id`)
    REFERENCES `airlines` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_flights_routes`
    FOREIGN KEY (`route_id`)
    REFERENCES `routes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_flights_aircraft`
    FOREIGN KEY (`aircraft_id`)
    REFERENCES `aircraft` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `flight_schedules`
-- -----------------------------------------------------
CREATE TABLE `flight_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flight_id` BIGINT UNSIGNED NOT NULL,
  `departure_date` DATE NOT NULL,
  `arrival_date` DATE NOT NULL,
  `actual_departure_time` DATETIME NULL,
  `actual_arrival_time` DATETIME NULL,
  `status` ENUM('scheduled', 'boarding', 'departed', 'in_air', 'landed', 'arrived', 'delayed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `delay_minutes` INT UNSIGNED NULL DEFAULT 0,
  `gate_departure` VARCHAR(10) NULL,
  `gate_arrival` VARCHAR(10) NULL,
  `terminal_departure` VARCHAR(10) NULL,
  `terminal_arrival` VARCHAR(10) NULL,
  `baggage_claim` VARCHAR(20) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_flight_schedules_flight_date` (`flight_id`, `departure_date`),
  INDEX `idx_flight_schedules_departure_date` (`departure_date`),
  CONSTRAINT `fk_flight_schedules_flights`
    FOREIGN KEY (`flight_id`)
    REFERENCES `flights` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `flight_fares`
-- -----------------------------------------------------
CREATE TABLE `flight_fares` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flight_id` BIGINT UNSIGNED NOT NULL,
  `fare_class_id` BIGINT UNSIGNED NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `available_seats` INT UNSIGNED NOT NULL,
  `is_refundable` TINYINT(1) NOT NULL DEFAULT 0,
  `cancellation_fee` DECIMAL(10,2) NULL,
  `change_fee` DECIMAL(10,2) NULL,
  `baggage_allowance_kg` INT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `effective_from` DATE NOT NULL,
  `effective_to` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_flight_fares_flight_class` (`flight_id`, `fare_class_id`, `effective_from`),
  INDEX `idx_flight_fares_fare_class_id` (`fare_class_id`),
  CONSTRAINT `fk_flight_fares_flights`
    FOREIGN KEY (`flight_id`)
    REFERENCES `flights` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_flight_fares_fare_classes`
    FOREIGN KEY (`fare_class_id`)
    REFERENCES `fare_classes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `price_history`
-- -----------------------------------------------------
CREATE TABLE `price_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flight_fare_id` BIGINT UNSIGNED NOT NULL,
  `price_date` DATE NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `available_seats` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_price_history_fare_date` (`flight_fare_id`, `price_date`),
  CONSTRAINT `fk_price_history_flight_fares`
    FOREIGN KEY (`flight_fare_id`)
    REFERENCES `flight_fares` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `seat_maps`
-- -----------------------------------------------------
CREATE TABLE `seat_maps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `aircraft_id` BIGINT UNSIGNED NOT NULL,
  `seat_number` VARCHAR(5) NOT NULL,
  `seat_type` ENUM('window', 'middle', 'aisle', 'other') NOT NULL,
  `cabin_class` ENUM('economy', 'premium_economy', 'business', 'first') NOT NULL,
  `is_exit_row` TINYINT(1) NOT NULL DEFAULT 0,
  `is_bulkhead` TINYINT(1) NOT NULL DEFAULT 0,
  `has_power` TINYINT(1) NOT NULL DEFAULT 0,
  `has_extra_legroom` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_seat_maps_aircraft_seat` (`aircraft_id`, `seat_number`),
  CONSTRAINT `fk_seat_maps_aircraft`
    FOREIGN KEY (`aircraft_id`)
    REFERENCES `aircraft` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `promotions`
-- -----------------------------------------------------
CREATE TABLE `promotions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `discount_type` ENUM('percentage', 'fixed_amount') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase_amount` DECIMAL(10,2) NULL,
  `max_discount_amount` DECIMAL(10,2) NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `usage_limit` INT UNSIGNED NULL,
  `used_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_promotions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `booking_status`
-- -----------------------------------------------------
CREATE TABLE `booking_status` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_booking_status_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert standard booking statuses
INSERT INTO `booking_status` (`name`, `description`) VALUES 
('pending', 'Booking has been initiated but not confirmed'),
('confirmed', 'Booking has been confirmed'),
('paid', 'Payment has been received'),
('cancelled', 'Booking has been cancelled'),
('refunded', 'Booking has been refunded'),
('completed', 'Travel has been completed');

-- -----------------------------------------------------
-- Table `bookings`
-- -----------------------------------------------------
CREATE TABLE `bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_reference` VARCHAR(10) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `status_id` BIGINT UNSIGNED NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `promotion_id` BIGINT UNSIGNED NULL,
  `discount_amount` DECIMAL(10,2) NULL DEFAULT 0.00,
  `contact_email` VARCHAR(255) NOT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `is_round_trip` TINYINT(1) NOT NULL DEFAULT 0,
  `booking_source` ENUM('website', 'mobile_app', 'phone', 'agent') NOT NULL,
  `special_requests` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_bookings_reference` (`booking_reference`),
  INDEX `idx_bookings_user_id` (`user_id`),
  INDEX `idx_bookings_status_id` (`status_id`),
  INDEX `idx_bookings_promotion_id` (`promotion_id`),
  CONSTRAINT `fk_bookings_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_booking_status`
    FOREIGN KEY (`status_id`)
    REFERENCES `booking_status` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_promotions`
    FOREIGN KEY (`promotion_id`)
    REFERENCES `promotions` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `booking_status_history`
-- -----------------------------------------------------
CREATE TABLE `booking_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `status_id` BIGINT UNSIGNED NOT NULL,
  `notes` TEXT NULL,
  `changed_by_user_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_booking_status_history_booking_id` (`booking_id`),
  INDEX `idx_booking_status_history_status_id` (`status_id`),
  INDEX `idx_booking_status_history_user_id` (`changed_by_user_id`),
  CONSTRAINT `fk_booking_status_history_bookings`
    FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_status_history_booking_status`
    FOREIGN KEY (`status_id`)
    REFERENCES `booking_status` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_status_history_users`
    FOREIGN KEY (`changed_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `booking_flights`
-- -----------------------------------------------------
CREATE TABLE `booking_flights` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `flight_schedule_id` BIGINT UNSIGNED NOT NULL,
  `fare_class_id` BIGINT UNSIGNED NOT NULL,
  `fare_amount` DECIMAL(10,2) NOT NULL,
  `tax_amount` DECIMAL(10,2) NOT NULL,
  `is_outbound` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Outbound or return flight',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_booking_flights_unique` (`booking_id`, `flight_schedule_id`),
  INDEX `idx_booking_flights_flight_schedule_id` (`flight_schedule_id`),
  INDEX `idx_booking_flights_fare_class_id` (`fare_class_id`),
  CONSTRAINT `fk_booking_flights_bookings`
    FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_flights_flight_schedules`
    FOREIGN KEY (`flight_schedule_id`)
    REFERENCES `flight_schedules` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_flights_fare_classes`
    FOREIGN KEY (`fare_class_id`)
    REFERENCES `fare_classes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `passengers`
-- -----------------------------------------------------
CREATE TABLE `passengers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `passport_number` VARCHAR(50) NULL,
  `passport_expiry` DATE NULL,
  `nationality` VARCHAR(100) NULL,
  `passenger_type` ENUM('adult', 'child', 'infant') NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_passengers_booking_id` (`booking_id`),
  CONSTRAINT `fk_passengers_bookings`
    FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `passenger_seats`
-- -----------------------------------------------------
CREATE TABLE `passenger_seats` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `passenger_id` BIGINT UNSIGNED NOT NULL,
  `booking_flight_id` BIGINT UNSIGNED NOT NULL,
  `seat_number` VARCHAR(5) NULL,
  `is_checked_in` TINYINT(1) NOT NULL DEFAULT 0,
  `checked_in_at` DATETIME NULL,
  `boarding_pass_issued` TINYINT(1) NOT NULL DEFAULT 0,
  `special_meal` VARCHAR(50) NULL,
  `special_service` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_passenger_seats_unique` (`passenger_id`, `booking_flight_id`),
  INDEX `idx_passenger_seats_booking_flight_id` (`booking_flight_id`),
  CONSTRAINT `fk_passenger_seats_passengers`
    FOREIGN KEY (`passenger_id`)
    REFERENCES `passengers` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_passenger_seats_booking_flights`
    FOREIGN KEY (`booking_flight_id`)
    REFERENCES `booking_flights` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `baggage`
-- -----------------------------------------------------
CREATE TABLE `baggage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `passenger_id` BIGINT UNSIGNED NOT NULL,
  `booking_flight_id` BIGINT UNSIGNED NOT NULL,
  `baggage_type` ENUM('checked', 'cabin') NOT NULL,
  `weight_kg` DECIMAL(5,2) NULL,
  `extra_fee` DECIMAL(10,2) NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_baggage_passenger_id` (`passenger_id`),
  INDEX `idx_baggage_booking_flight_id` (`booking_flight_id`),
  CONSTRAINT `fk_baggage_passengers`
    FOREIGN KEY (`passenger_id`)
    REFERENCES `passengers` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_baggage_booking_flights`
    FOREIGN KEY (`booking_flight_id`)
    REFERENCES `booking_flights` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `payment_methods`
-- -----------------------------------------------------
CREATE TABLE `payment_methods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_payment_methods_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert standard payment methods for Indian market
INSERT INTO `payment_methods` (`name`, `code`, `description`) VALUES 
('UPI', 'upi', 'Unified Payments Interface'),
('RazorPay', 'razorpay', 'RazorPay Payment Gateway'),
('Credit Card', 'credit_card', 'Credit Card Payment'),
('Debit Card', 'debit_card', 'Debit Card Payment'),
('Net Banking', 'net_banking', 'Internet Banking'),
('PayTM', 'paytm', 'PayTM Wallet'),
('Google Pay', 'gpay', 'Google Pay');

-- -----------------------------------------------------
-- Table `payments`
-- -----------------------------------------------------
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `payment_method_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'INR',
  `status` ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL,
  `transaction_id` VARCHAR(100) NULL,
  `payment_date` DATETIME NULL,
  `billing_address` TEXT NULL,
  `billing_city` VARCHAR(100) NULL,
  `billing_state` VARCHAR(100) NULL,
  `billing_postal_code` VARCHAR(20) NULL,
  `billing_country` VARCHAR(100) NULL,
  `payer_email` VARCHAR(255) NULL,
  `payer_phone` VARCHAR(20) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_payments_booking_id` (`booking_id`),
  INDEX `idx_payments_payment_method_id` (`payment_method_id`),
  INDEX `idx_payments_transaction_id` (`transaction_id`),
  CONSTRAINT `fk_payments_bookings`
    FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_payment_methods`
    FOREIGN KEY (`payment_method_id`)
    REFERENCES `payment_methods` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `refunds`
-- -----------------------------------------------------
CREATE TABLE `refunds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `reason` TEXT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'declined') NOT NULL,
  `refund_transaction_id` VARCHAR(100) NULL,
  `refunded_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_refunds_payment_id` (`payment_id`),
  CONSTRAINT `fk_refunds_payments`
    FOREIGN KEY (`payment_id`)
    REFERENCES `payments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_saved_trips`
-- -----------------------------------------------------
CREATE TABLE `user_saved_trips` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `origin_airport_id` BIGINT UNSIGNED NOT NULL,
  `destination_airport_id` BIGINT UNSIGNED NOT NULL,
  `trip_name` VARCHAR(100) NULL,
  `departure_date` DATE NULL,
  `return_date` DATE NULL,
  `is_round_trip` TINYINT(1) NOT NULL DEFAULT 0,
  `passengers_adults` INT UNSIGNED NOT NULL DEFAULT 1,
  `passengers_children` INT UNSIGNED NOT NULL DEFAULT 0,
  `passengers_infants` INT UNSIGNED NOT NULL DEFAULT 0,
  `preferred_cabin_class` ENUM('economy', 'premium_economy', 'business', 'first') NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_saved_trips_user_id` (`user_id`),
  INDEX `idx_user_saved_trips_origin` (`origin_airport_id`),
  INDEX `idx_user_saved_trips_destination` (`destination_airport_id`),
  CONSTRAINT `fk_user_saved_trips_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_saved_trips_origin`
    FOREIGN KEY (`origin_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_saved_trips_destination`
    FOREIGN KEY (`destination_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `search_history`
-- -----------------------------------------------------
CREATE TABLE `search_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `origin_airport_id` BIGINT UNSIGNED NOT NULL,
  `destination_airport_id` BIGINT UNSIGNED NOT NULL,
  `departure_date` DATE NOT NULL,
  `return_date` DATE NULL,
  `is_round_trip` TINYINT(1) NOT NULL DEFAULT 0,
  `passengers_adults` INT UNSIGNED NOT NULL DEFAULT 1,
  `passengers_children` INT UNSIGNED NOT NULL DEFAULT 0,
  `passengers_infants` INT UNSIGNED NOT NULL DEFAULT 0,
  `preferred_cabin_class` ENUM('economy', 'premium_economy', 'business', 'first') NULL,
  `device_info` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_search_history_user_id` (`user_id`),
  INDEX `idx_search_history_origin` (`origin_airport_id`),
  INDEX `idx_search_history_destination` (`destination_airport_id`),
  INDEX `idx_search_history_dates` (`departure_date`, `return_date`),
  CONSTRAINT `fk_search_history_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_search_history_origin`
    FOREIGN KEY (`origin_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_search_history_destination`
    FOREIGN KEY (`destination_airport_id`)
    REFERENCES `airports` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_activity_log`
-- -----------------------------------------------------
CREATE TABLE `user_activity_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `activity_type` VARCHAR(50) NOT NULL,
  `activity_details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_activity_log_user_id` (`user_id`),
  INDEX `idx_user_activity_log_activity_type` (`activity_type`),
  CONSTRAINT `fk_user_activity_log_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `system_settings`
-- -----------------------------------------------------
CREATE TABLE `system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `setting_group` VARCHAR(50) NOT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_system_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Triggers for Audit Trail
-- -----------------------------------------------------

-- Trigger for booking status changes
DELIMITER $$
CREATE TRIGGER after_booking_status_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status_id != NEW.status_id THEN
        INSERT INTO booking_status_history (booking_id, status_id)
        VALUES (NEW.id, NEW.status_id);
    END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- Stored Procedures
-- -----------------------------------------------------

-- Procedure to get available flights with prices
DELIMITER $$
CREATE PROCEDURE get_available_flights(
  IN p_origin_airport_code VARCHAR(3),
  IN p_destination_airport_code VARCHAR(3),
  IN p_departure_date DATE,
  IN p_cabin_class ENUM('economy', 'premium_economy', 'business', 'first'),
  IN p_passengers INT
)
BEGIN
  SELECT 
    fs.id AS flight_schedule_id,
    f.flight_number,
    al.name AS airline_name,
    al.code AS airline_code,
    org.code AS origin_code,
    org.name AS origin_name,
    dst.code AS destination_code,
    dst.name AS destination_name,
    fs.departure_date,
    TIME_FORMAT(f.departure_time, '%H:%i') AS departure_time,
    fs.arrival_date,
    TIME_FORMAT(f.arrival_time, '%H:%i') AS arrival_time,
    f.duration_minutes,
    fc.name AS fare_class_name,
    fc.cabin_class,
    ff.base_price,
    ff.tax_percent,
    ROUND(ff.base_price * (1 + ff.tax_percent/100), 2) AS total_price,
    ff.available_seats,
    ff.is_refundable,
    ff.baggage_allowance_kg
  FROM 
    airports org
    JOIN routes r ON org.id = r.origin_airport_id
    JOIN airports dst ON dst.id = r.destination_airport_id
    JOIN flights f ON r.id = f.route_id
    JOIN flight_schedules fs ON f.id = fs.flight_id
    JOIN flight_fares ff ON f.id = ff.flight_id
    JOIN fare_classes fc ON ff.fare_class_id = fc.id
    JOIN airlines al ON f.airline_id = al.id
  WHERE 
    org.code = p_origin_airport_code
    AND dst.code = p_destination_airport_code
    AND fs.departure_date = p_departure_date
    AND fc.cabin_class = p_cabin_class
    AND ff.available_seats >= p_passengers
    AND fs.status != 'cancelled'
    AND f.is_active = 1
    AND ff.is_active = 1
    AND CURDATE() BETWEEN ff.effective_from AND IFNULL(ff.effective_to, '2099-12-31')
  ORDER BY 
    ff.base_price ASC;
END$$
DELIMITER ;

-- Procedure to create a new booking
DELIMITER $$
CREATE PROCEDURE create_booking(
  IN p_user_id BIGINT,
  IN p_flight_schedule_id BIGINT,
  IN p_fare_class_id BIGINT,
  IN p_passengers_count INT,
  OUT p_booking_id BIGINT,
  OUT p_booking_reference VARCHAR(10)
)
BEGIN
  DECLARE v_fare_amount DECIMAL(10,2);
  DECLARE v_tax_amount DECIMAL(10,2);
  DECLARE v_total_amount DECIMAL(10,2);
  DECLARE v_status_id BIGINT;
  
  -- Generate unique booking reference
  SET p_booking_reference = CONCAT(
    CHAR(65 + FLOOR(RAND() * 26)),
    CHAR(65 + FLOOR(RAND() * 26)),
    LPAD(FLOOR(RAND() * 10000000), 7, '0')
  );
  
  -- Get fare and tax amounts
  SELECT 
    ff.base_price, 
    ROUND(ff.base_price * ff.tax_percent / 100, 2)
  INTO 
    v_fare_amount, 
    v_tax_amount
  FROM 
    flight_fares ff
    JOIN flights f ON ff.flight_id = f.id
    JOIN flight_schedules fs ON f.id = fs.flight_id
  WHERE 
    fs.id = p_flight_schedule_id 
    AND ff.fare_class_id = p_fare_class_id;
  
  -- Calculate total amount
  SET v_total_amount = (v_fare_amount + v_tax_amount) * p_passengers_count;
  
  -- Get pending status ID
  SELECT id INTO v_status_id FROM booking_status WHERE name = 'pending' LIMIT 1;
  
  -- Start transaction
  START TRANSACTION;
  
  -- Create booking
  INSERT INTO bookings (
    booking_reference, 
    user_id, 
    status_id, 
    total_amount,
    contact_email,
    contact_phone,
    booking_source
  )
  SELECT 
    p_booking_reference,
    p_user_id,
    v_status_id,
    v_total_amount,
    u.email,
    u.phone_number,
    'website'
  FROM users u
  WHERE u.id = p_user_id;
  
  -- Get the booking ID
  SET p_booking_id = LAST_INSERT_ID();
  
  -- Add booking status history
  INSERT INTO booking_status_history (booking_id, status_id)
  VALUES (p_booking_id, v_status_id);
  
  -- Add booking flight
  INSERT INTO booking_flights (
    booking_id,
    flight_schedule_id,
    fare_class_id,
    fare_amount,
    tax_amount,
    is_outbound
  )
  VALUES (
    p_booking_id,
    p_flight_schedule_id,
    p_fare_class_id,
    v_fare_amount,
    v_tax_amount,
    1
  );
  
  -- Commit the transaction
  COMMIT;
  
  -- If we get here, no errors occurred
  SELECT p_booking_id, p_booking_reference;
END$$
DELIMITER ;

-- Procedure to check seat availability for a flight
DELIMITER $$
CREATE PROCEDURE check_seat_availability(
  IN p_flight_schedule_id BIGINT,
  IN p_fare_class_id BIGINT
)
BEGIN
  SELECT 
    fc.cabin_class,
    ff.available_seats,
    sm.seat_number,
    CASE 
      WHEN ps.seat_number IS NULL THEN 'available'
      ELSE 'occupied'
    END AS status
  FROM 
    flight_schedules fs
    JOIN flights f ON fs.flight_id = f.id
    JOIN flight_fares ff ON f.id = ff.flight_id AND ff.fare_class_id = p_fare_class_id
    JOIN fare_classes fc ON ff.fare_class_id = fc.id
    JOIN aircraft a ON f.aircraft_id = a.id
    JOIN seat_maps sm ON a.id = sm.aircraft_id AND sm.cabin_class = fc.cabin_class
    LEFT JOIN booking_flights bf ON fs.id = bf.flight_schedule_id
    LEFT JOIN passenger_seats ps ON bf.id = ps.booking_flight_id AND ps.seat_number = sm.seat_number
  WHERE 
    fs.id = p_flight_schedule_id
  ORDER BY 
    sm.seat_number;
END$$
DELIMITER ;

-- Procedure to get booking details
DELIMITER $$
CREATE PROCEDURE get_booking_details(
  IN p_booking_reference VARCHAR(10)
)
BEGIN
  SELECT 
    b.booking_reference,
    b.total_amount,
    bs.name AS booking_status,
    b.created_at AS booking_date,
    u.email AS user_email,
    u.phone_number AS user_phone,
    
    p.first_name,
    p.last_name,
    p.passenger_type,
    
    al.name AS airline_name,
    f.flight_number,
    
    org.name AS origin_airport,
    org.code AS origin_code,
    dst.name AS destination_airport,
    dst.code AS destination_code,
    
    fs.departure_date,
    TIME_FORMAT(f.departure_time, '%H:%i') AS departure_time,
    fs.arrival_date,
    TIME_FORMAT(f.arrival_time, '%H:%i') AS arrival_time,
    
    fc.name AS fare_class,
    fc.cabin_class,
    
    ps.seat_number,
    ps.is_checked_in,
    ps.checked_in_at
  FROM 
    bookings b
    JOIN booking_status bs ON b.status_id = bs.id
    JOIN users u ON b.user_id = u.id
    JOIN passengers p ON b.id = p.booking_id
    JOIN booking_flights bf ON b.id = bf.booking_id
    JOIN flight_schedules fs ON bf.flight_schedule_id = fs.id
    JOIN flights f ON fs.flight_id = f.id
    JOIN airlines al ON f.airline_id = al.id
    JOIN routes r ON f.route_id = r.id
    JOIN airports org ON r.origin_airport_id = org.id
    JOIN airports dst ON r.destination_airport_id = dst.id
    JOIN fare_classes fc ON bf.fare_class_id = fc.id
    LEFT JOIN passenger_seats ps ON p.id = ps.passenger_id AND bf.id = ps.booking_flight_id
  WHERE 
    b.booking_reference = p_booking_reference
  ORDER BY 
    p.is_primary DESC, 
    p.id;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- Indexes for frequently accessed data
-- -----------------------------------------------------

-- Index for flight searches
CREATE INDEX idx_flight_schedules_search ON flight_schedules (departure_date, status);
CREATE INDEX idx_flight_fares_search ON flight_fares (is_active, effective_from, effective_to);
CREATE INDEX idx_booking_flights_schedule ON booking_flights (flight_schedule_id);

-- Index for popular routes
CREATE INDEX idx_routes_popular ON routes (origin_airport_id, destination_airport_id, is_active);

-- -----------------------------------------------------
-- Views for reports and analytics
-- -----------------------------------------------------

-- View for popular routes
CREATE VIEW vw_popular_routes AS
SELECT 
  r.id AS route_id,
  orgCity.name AS origin_city,
  dstCity.name AS destination_city,
  orgCountry.name AS origin_country,
  dstCountry.name AS destination_country,
  COUNT(DISTINCT bf.id) AS booking_count
FROM 
  routes r
  JOIN airports org ON r.origin_airport_id = org.id
  JOIN airports dst ON r.destination_airport_id = dst.id
  JOIN cities orgCity ON org.city_id = orgCity.id
  JOIN cities dstCity ON dst.city_id = dstCity.id
  JOIN countries orgCountry ON orgCity.country_id = orgCountry.id
  JOIN countries dstCountry ON dstCity.country_id = dstCountry.id
  JOIN flights f ON r.id = f.route_id
  JOIN flight_schedules fs ON f.id = fs.flight_id
  JOIN booking_flights bf ON fs.id = bf.flight_schedule_id
  JOIN bookings b ON bf.booking_id = b.id
WHERE 
  b.created_at > DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY 
  r.id, 
  orgCity.name, 
  dstCity.name, 
  orgCountry.name, 
  dstCountry.name
ORDER BY 
  booking_count DESC;

-- View for revenue by route
CREATE VIEW vw_revenue_by_route AS
SELECT 
  r.id AS route_id,
  orgCity.name AS origin_city,
  dstCity.name AS destination_city,
  SUM(bf.fare_amount + bf.tax_amount) AS total_revenue,
  COUNT(DISTINCT b.id) AS booking_count,
  SUM(bf.fare_amount + bf.tax_amount) / COUNT(DISTINCT b.id) AS average_fare
FROM 
  routes r
  JOIN airports org ON r.origin_airport_id = org.id
  JOIN airports dst ON r.destination_airport_id = dst.id
  JOIN cities orgCity ON org.city_id = orgCity.id
  JOIN cities dstCity ON dst.city_id = dstCity.id
  JOIN flights f ON r.id = f.route_id
  JOIN flight_schedules fs ON f.id = fs.flight_id
  JOIN booking_flights bf ON fs.id = bf.flight_schedule_id
  JOIN bookings b ON bf.booking_id = b.id
WHERE 
  b.created_at > DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY 
  r.id, 
  orgCity.name, 
  dstCity.name
ORDER BY 
  total_revenue DESC;

