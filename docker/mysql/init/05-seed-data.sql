-- Seed base data first

-- Seed countries
INSERT INTO countries (name, code) VALUES
('India', 'IN'),
('United States', 'US'),
('United Kingdom', 'GB'),
('United Arab Emirates', 'AE'),
('Singapore', 'SG');

-- Seed currencies
INSERT INTO currencies (code, name, symbol, exchange_rate, is_active) VALUES
('USD', 'US Dollar', '$', 1.00, true),
('EUR', 'Euro', '€', 0.85, true),
('GBP', 'British Pound', '£', 0.73, true),
('AED', 'UAE Dirham', 'د.إ', 3.67, true),
('SGD', 'Singapore Dollar', 'S$', 1.35, true),
('INR', 'Indian Rupee', '₹', 83.00, true);

-- Seed cities
INSERT INTO cities (country_id, name, timezone) VALUES
(1, 'Delhi', 'Asia/Kolkata'),
(1, 'Mumbai', 'Asia/Kolkata'),
(1, 'Bangalore', 'Asia/Kolkata'),
(1, 'Chennai', 'Asia/Kolkata'),
(1, 'Hyderabad', 'Asia/Kolkata'),
(2, 'New York', 'America/New_York'),
(2, 'Los Angeles', 'America/Los_Angeles'),
(3, 'London', 'Europe/London'),
(4, 'Dubai', 'Asia/Dubai'),
(5, 'Singapore', 'Asia/Singapore');

-- Seed airports
INSERT INTO airports (city_id, name, code, latitude, longitude, is_active) VALUES
(1, 'Indira Gandhi International Airport', 'DEL', 28.5561, 77.0994, true),
(2, 'Chhatrapati Shivaji Maharaj International Airport', 'BOM', 19.0896, 72.8656, true),
(3, 'Kempegowda International Airport', 'BLR', 13.1986, 77.7066, true),
(4, 'Chennai International Airport', 'MAA', 12.9941, 80.1709, true),
(5, 'Rajiv Gandhi International Airport', 'HYD', 17.2403, 78.4294, true),
(6, 'John F. Kennedy International Airport', 'JFK', 40.6413, -73.7781, true),
(7, 'Los Angeles International Airport', 'LAX', 33.9416, -118.4085, true),
(8, 'Heathrow Airport', 'LHR', 51.4700, -0.4543, true),
(9, 'Dubai International Airport', 'DXB', 25.2528, 55.3644, true),
(10, 'Singapore Changi Airport', 'SIN', 1.3644, 103.9915, true);

-- Seed airlines
INSERT INTO airlines (name, code, country_id, is_active) VALUES
('Air India', 'AI', 1, true),
('Emirates', 'EK', 4, true),
('British Airways', 'BA', 3, true);

-- Seed aircraft
INSERT INTO aircraft (airline_id, model, registration_number, total_seats, manufacturing_year, is_active) VALUES
(1, 'Boeing 737', 'VT-AIN', 180, 2018, true),
(1, 'Airbus A320', 'VT-AIA', 160, 2019, true),
(2, 'Boeing 777', 'A6-EMW', 220, 2015, true),
(2, 'Airbus A380', 'A6-EVB', 280, 2016, true),
(3, 'Boeing 787', 'G-ZBJG', 250, 2017, true);

-- Seed fare classes
INSERT INTO fare_classes (name, code, description, is_active) VALUES
('Economy', 'ECON', 'Standard economy class seating', true),
('Premium Economy', 'PECO', 'Enhanced economy experience with extra legroom', true),
('Business', 'BUSS', 'Business class with premium services', true),
('First Class', 'FIRST', 'Luxury first class experience', true);

-- Seed routes
INSERT INTO routes (origin_airport_id, destination_airport_id, distance_km, flight_time_minutes, is_active) VALUES
(1, 2, 1148, 120, true),  -- Delhi to Mumbai
(2, 3, 845, 90, true),    -- Mumbai to Bangalore
(1, 9, 2200, 150, true),  -- Delhi to Dubai
(9, 8, 5500, 240, true),  -- Dubai to London
(8, 6, 5570, 150, true);  -- London to New York

-- Seed sample admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('admin@skyjourney.com', '$2b$10$XgK3F8u5yy4ChV7xXgjCa.oO.2tTsT9ULx8QpZ5H1typiKw1NQ3S6', 'Admin', 'User', 'admin', true);

-- Seed flights
INSERT INTO flights (
    airline_id,
    route_id,
    flight_number,
    departure_time,
    arrival_time,
    aircraft_id,
    status
) VALUES
(1, 1, 'AI101', '2024-02-01 10:00:00', '2024-02-01 12:00:00', 1, 'scheduled'),
(1, 2, 'AI202', '2024-02-01 14:00:00', '2024-02-01 15:30:00', 2, 'scheduled'),
(2, 3, 'EK513', '2024-02-01 22:00:00', '2024-02-02 00:30:00', 3, 'scheduled'),
(2, 4, 'EK007', '2024-02-02 02:30:00', '2024-02-02 06:30:00', 4, 'scheduled'),
(3, 5, 'BA001', '2024-02-02 09:00:00', '2024-02-02 11:30:00', 5, 'scheduled');

-- Add flight fares
INSERT INTO flight_fares (flight_id, fare_class_id, base_price, available_seats) VALUES
(1, 1, 150.00, 100),  -- AI101 Economy
(1, 2, 250.00, 50),   -- AI101 Premium Economy
(1, 3, 450.00, 20),   -- AI101 Business
(2, 1, 120.00, 100),  -- AI202 Economy
(2, 2, 220.00, 40),   -- AI202 Premium Economy
(3, 1, 450.00, 120),  -- EK513 Economy
(3, 3, 1200.00, 60),  -- EK513 Business
(4, 1, 750.00, 150),  -- EK007 Economy
(4, 3, 2500.00, 80),  -- EK007 Business
(5, 1, 890.00, 150),  -- BA001 Economy
(5, 3, 3500.00, 60);  -- BA001 Business
