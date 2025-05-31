-- Create additional indexes for performance optimization

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_user_profiles_names ON user_profiles(first_name, last_name);

-- Flight and route indexes
CREATE INDEX idx_flights_airline ON flights(airline_id);
CREATE INDEX idx_flights_route ON flights(route_id);
CREATE INDEX idx_flights_departure ON flights(departure_time);
CREATE INDEX idx_flights_aircraft ON flights(aircraft_id);
CREATE INDEX idx_flights_status ON flights(status);

CREATE INDEX idx_routes_origin ON routes(origin_airport_id);
CREATE INDEX idx_routes_destination ON routes(destination_airport_id);

CREATE INDEX idx_airports_code ON airports(code);
CREATE INDEX idx_airports_city ON airports(city_id);

-- Booking indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

CREATE INDEX idx_booking_flights_booking ON booking_flights(booking_id);
CREATE INDEX idx_booking_flights_flight ON booking_flights(flight_id);

CREATE INDEX idx_passengers_booking ON passengers(booking_id);
CREATE INDEX idx_passenger_seats_passenger ON passenger_seats(passenger_id);

-- Payment indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Search and activity indexes
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_route ON search_history(origin_airport_id, destination_airport_id);
CREATE INDEX idx_search_history_dates ON search_history(departure_date, return_date);

CREATE INDEX idx_user_activity_log_user ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_type ON user_activity_log(activity_type);
