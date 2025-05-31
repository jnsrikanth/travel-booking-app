-- Enable strict mode and proper character set
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO,STRICT_ALL_TABLES";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Create and use the database
CREATE DATABASE IF NOT EXISTS skyjourney_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE skyjourney_db;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON skyjourney_db.* TO 'skyjourney'@'%';
FLUSH PRIVILEGES;
