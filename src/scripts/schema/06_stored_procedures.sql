-- Stored procedures for common operations

-- Procedure to get available flights
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetAvailableFlights(
  IN p_origin_airport_code VARCHAR(3),
  IN p_destination_airport_code VARCHAR(3),
  IN p_departure_date DATE,
  IN p_return_date DATE,
  IN p_passengers INT,
  IN p_fare_class_code VARCHAR(5)
)
BEGIN
  -- Get origin and destination airport IDs
  DECLARE v_origin_airport_id INT;
  DECLARE v_destination_airport_id INT;
  DECLARE v_fare_class_id INT;
  
  SELECT id INTO v_origin_airport_id 
  FROM airports 
  WHERE code = p_origin_airport_code AND is_active = TRUE;
  
  SELECT id INTO v_destination_airport_id 
  FROM airports 
  WHERE code = p_destination_airport_code AND is_active = TRUE;
  
  IF p_fare_class_code IS NOT NULL THEN
    SELECT id INTO v_fare_class_id 
    FROM fare_classes 
    WHERE code = p_fare_class_code AND is_active = TRUE;
  END IF;

  -- Get outbound flights
  SELECT 
    f.id,
    f.flight_number,
    a.name AS airline_name,
    a.logo_url,
    o.code AS origin_code,
    o.name AS origin_name,
    d.code AS destination_code,
    d.name AS destination_name,
    oc.name AS origin_city,
    dc.name AS destination_city,
    f.departure_time,
    f.arrival_time,
    r.flight_time_minutes,
    fc.name AS fare_class,
    ff.base_price,
    ff.available_seats
  FROM 
    flights f
    JOIN airlines a ON f.airline_id = a.id
    JOIN routes r ON f.route_id = r.id
    JOIN airports o ON r.origin_airport_id = o.id
    JOIN airports d ON r.destination_airport_id = d.id
    JOIN cities oc ON o.city_id = oc.id
    JOIN cities dc ON d.city_id = dc.id
    JOIN flight_fares ff ON f.id = ff.flight_id
    JOIN fare_classes fc ON ff.fare_class_id = fc.id
  WHERE 
    r.origin_airport_id = v_origin_airport_id
    AND r.destination_airport_id = v_destination_airport_id
    AND DATE(f.departure_time) = p_departure_date
    AND ff.available_seats >= p_passengers
    AND f.status = 'scheduled'
    AND (v_fare_class_id IS NULL OR ff.fare_class_id = v_fare_class_id)
  ORDER BY 
    f.departure_time;
    
  -- Get return flights if return date is specified
  IF p_return_date IS NOT NULL THEN
    SELECT 
      f.id,
      f.flight_number,
      a.name AS airline_name,
      a.logo_url,
      o.code AS origin_code,
      o.name AS origin_name,
      d.code AS destination_code,
      d.name AS destination_name,
      oc.name AS origin_city,
      dc.name AS destination_city,
      f.departure_time,
      f.arrival_time,
      r.flight_time_minutes,
      fc.name AS fare_class,
      ff.base_price,
      ff.available_seats
    FROM 
      flights f
      JOIN airlines a ON f.airline_id = a.id
      JOIN routes r ON f.route_id = r.id
      JOIN airports o ON r.origin_airport_id = o.id
      JOIN airports d ON r.destination_airport_id = d.id
      JOIN cities oc ON o.city_id = oc.id
      JOIN cities dc ON d.city_id = dc.id
      JOIN flight_fares ff ON f.id = ff.flight_id
      JOIN fare_classes fc ON ff.fare_class_id = fc.id
    WHERE 
      r.origin_airport_id = v_destination_airport_id
      AND r.destination_airport_id = v_origin_airport_id
      AND DATE(f.departure_time) = p_return_date
      AND ff.available_seats >= p_passengers
      AND f.status = 'scheduled'
      AND (v_fare_class_id IS NULL OR ff.fare_class_id = v_fare_class_id)
    ORDER BY 
      f.departure_time;
  END IF;
END //
DELIMITER ;

-- Procedure to create a booking
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateBooking(
  IN p_user_id INT,
  IN p_flight_ids JSON,
  IN p_passenger_details JSON,
  IN p_payment_method_id INT,
  IN p_total_amount DECIMAL(10, 2)
)
BEGIN
  DECLARE v_booking_id INT;
  DECLARE v_booking_reference VARCHAR(10);
  DECLARE v_flight_id INT;
  DECLARE v_fare_class_id INT;
  DECLARE v_passenger_id INT;
  DECLARE i INT DEFAULT 0;
  DECLARE j INT DEFAULT 0;
  DECLARE v_flights_count INT;
  DECLARE v_passengers_count INT;
  DECLARE v_transaction_id VARCHAR(100);
  DECLARE v_passenger_first_name VARCHAR(100);
  DECLARE v_passenger_last_name VARCHAR(100);
  DECLARE v_passenger_dob DATE;
  DECLARE v_passenger_gender VARCHAR(20);
  DECLARE v_passenger_type VARCHAR(10);
  
  -- Start transaction
  START TRANSACTION;
  
  -- Generate unique booking reference
  SET v_booking_reference = CONCAT(
    CHAR(FLOOR(65 + RAND() * 25)), 
    CHAR(FLOOR(65 + RAND() * 25)),
    LPAD(FLOOR(RAND() * 999999), 6, '0')
  );
  
  -- Create booking record
  INSERT INTO bookings (
    user_id, 
    booking_reference, 
    status_id, 
    total_amount, 
    currency, 
    contact_email,
    contact_phone
  ) 
  SELECT 
    p_user_id, 
    v_booking_reference, 
    (SELECT id FROM booking_status WHERE name = 'pending'), 
    p_total_amount, 
    'INR',
    email,
    phone_number
  FROM users 
  WHERE id = p_user_id;
  
  SET v_booking_id = LAST_INSERT_ID();
  
  -- Insert booking status history
  INSERT INTO booking_status_history (
    booking_id, 
    status_id, 
    changed_by
  ) VALUES (
    v_booking_id, 
    (SELECT id FROM booking_status WHERE name = 'pending'), 
    p_user_id
  );
  
  -- Process flights
  SET v_flights_count = JSON_LENGTH(p_flight_ids);
  
  WHILE i < v_flights_count DO
    SET v_flight_id = JSON_EXTRACT(p_flight_ids, CONCAT('$[', i, '].flight_id'));
    SET v_fare_class_id = JSON_EXTRACT(p_flight_ids, CONCAT('$[', i, '].fare_class_id'));
    
    -- Insert booking flights
    INSERT INTO booking_flights (
      booking_id, 
      flight_id, 
      fare_class_id
    ) VALUES (
      v_booking_id, 
      v_flight_id, 
      v_fare_class_id
    );
    
    -- Update available seats
    UPDATE flight_fares 
    SET available_seats = available_seats - (SELECT JSON_LENGTH(p_passenger_details))
    WHERE flight_id = v_flight_id AND fare_class_id = v_fare_class_id;
    
    SET i = i + 1;
  END WHILE;
  
  -- Process passengers
  SET v_passengers_count = JSON_LENGTH(p_passenger_details);
  
  WHILE j < v_passengers_count DO
    SET v_passenger_first_name = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].first_name')));
    SET v_passenger_last_name = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].last_name')));
    SET v_passenger_dob = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].date_of_birth')));
    SET v_passenger_gender = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].gender')));
    SET v_passenger_type = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].passenger_type')));
    
    -- Insert passenger
    INSERT INTO passengers (
      booking_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      passenger_type
    ) VALUES (
      v_booking_id,
      v_passenger_first_name,
      v_passenger_last_name,
      v_passenger_dob,
      v_passenger_gender,
      v_passenger_type
    );
    
    SET j = j + 1;
  END WHILE;
  
  -- Create payment record
  SET v_transaction_id = CONCAT('TXN', LPAD(FLOOR(RAND() * 9999999999), 10, '0'));
  
  INSERT INTO payments (
    booking_id,
    payment_method_id,
    transaction_id,
    amount,
    currency,
    status
  ) VALUES (
    v_booking_id,
    p_payment_method_id,
    v_transaction_id,
    p_total_amount,
    'INR',
    'pending'
  );
  
  -- Return booking ID
  SELECT v_booking_id AS booking_id, v_booking_reference AS booking_reference;
  
  COMMIT;
END //
DELIMITER ;

-- Procedure to check seat availability
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CheckSeatAvailability(
  IN p_flight_id INT,
  IN p_departure_date DATE
)
BEGIN
  SELECT 
    sm.id AS seat_map_id,
    sm.seat_number,
    sm.seat_type,
    fc.name AS fare_class,
    sm.is_emergency_exit,
    sm.is_aisle,
    sm.is_window,
    CASE 
      WHEN ps.id IS NULL THEN TRUE 
      ELSE FALSE 
    END AS is_available
  FROM 
    seat_maps sm
    JOIN aircraft ac ON sm.aircraft_id = ac.id
    JOIN fare_classes fc ON sm.fare_class_id = fc.id
    JOIN flights f ON f.aircraft_id = ac.id
    LEFT JOIN booking_flights bf ON bf.flight_id = f.id
    LEFT JOIN passenger_seats ps ON ps.seat_map_id = sm.id AND ps.booking_flight_id = bf.id
  WHERE 
    f.id = p_flight_id
    AND DATE(f.departure_time) = p_departure_date
    AND sm.is_active = TRUE
  ORDER BY 
    sm.seat_number;
END //
DELIMITER ;

-- Procedure to get booking details
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetBookingDetails(
  IN p_booking_id INT
)
BEGIN
  -- Get booking information
  SELECT 
    b.id,
    b.booking_reference,
    bs.name AS status,
    b.total_amount,
    b.currency,
    b.booking_date,
    b.contact_email,
    b.contact_phone,
    u.email AS user_email,
    u.phone_number AS user_phone,
    up.first_name AS user_first_name,
    up.last_name AS user_last_name
  FROM 
    bookings b
    JOIN users u ON b.user_id = u.id
    JOIN user_profiles up ON u.id = up.user_id
    JOIN booking_status bs ON b.status_id = bs.id
  WHERE 
    b.id = p_booking_id;
    
  -- Get flights information
  SELECT 
    bf.id AS booking_flight_id,
    f.flight_number,
    a.name AS airline_name,
    a.logo_url,
    o.code AS origin_code,
    o.name AS origin_name,
    d.code AS destination_code,
    d.name AS destination_name,
    oc.name AS origin_city,
    dc.name AS destination_city,
    f.departure_time,
    f.arrival_time,
    r.flight_time_minutes,
    fc.name AS fare_class
  FROM 
    booking_flights bf
    JOIN flights f ON bf.flight_id = f.id
    JOIN airlines a ON f.airline_id = a.id
    JOIN routes r ON f.route_id = r.id
    JOIN airports o ON r.origin_airport_id = o.id
    JOIN airports d ON r.destination_airport_id = d.id
    JOIN cities oc ON o.city_id = oc.id
    JOIN cities dc ON d.city_id = dc.id
    JOIN fare_classes fc ON bf.fare_class_id = fc.id
  WHERE 
    bf.booking_id = p_booking_id;
    
  -- Get passengers information
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.passenger_type,
    bf.id AS booking_flight_id,
    ps.id AS passenger_seat_id,
    sm.seat_number,
    sm.seat_type,
    sm.is_emergency_exit,
    sm.is_aisle,
    sm.is_window
  FROM 
    passengers p
    LEFT JOIN passenger_seats ps ON p.id = ps.passenger_id
    LEFT JOIN booking_flights bf ON ps.booking_flight_id = bf.id
    LEFT JOIN seat_maps sm ON ps.seat_map_id = sm.id
  WHERE 
    p.booking_id = p_booking_id;
    
  -- Get payment information
  SELECT 
    p.id,
    p.transaction_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_date,
    pm.name AS payment_method
  FROM 
    payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
  WHERE 
    p.booking_id = p_booking_id;
    
  -- Get baggage information
  SELECT 
    b.id,
    b.baggage_type,
    b.weight_kg,
    b.price,
    p.first_name,
    p.last_name,
    bf.id AS booking_flight_id
  FROM 
    baggage b
    JOIN passengers p ON b.passenger_id = p.id
    JOIN booking_flights bf ON b.booking_flight_id = bf.id
  WHERE 
    p.booking_id = p_booking_id;
END //
DELIMITER ;

-- Stored procedures for common operations

-- Procedure to get available flights
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetAvailableFlights(
  IN p_origin_airport_code VARCHAR(3),
  IN p_destination_airport_code VARCHAR(3),
  IN p_departure_date DATE,
  IN p_return_date DATE,
  IN p_passengers INT,
  IN p_fare_class_code VARCHAR(5)
)
BEGIN
  -- Get origin and destination airport IDs
  DECLARE v_origin_airport_id INT;
  DECLARE v_destination_airport_id INT;
  DECLARE v_fare_class_id INT;
  
  SELECT id INTO v_origin_airport_id 
  FROM airports 
  WHERE code = p_origin_airport_code AND is_active = TRUE;
  
  SELECT id INTO v_destination_airport_id 
  FROM airports 
  WHERE code = p_destination_airport_code AND is_active = TRUE;
  
  IF p_fare_class_code IS NOT NULL THEN
    SELECT id INTO v_fare_class_id 
    FROM fare_classes 
    WHERE code = p_fare_class_code AND is_active = TRUE;
  END IF;

  -- Get outbound flights
  SELECT 
    f.id,
    f.flight_number,
    a.name AS airline_name,
    a.logo_url,
    o.code AS origin_code,
    o.name AS origin_name,
    d.code AS destination_code,
    d.name AS destination_name,
    oc.name AS origin_city,
    dc.name AS destination_city,
    f.departure_time,
    f.arrival_time,
    r.flight_time_minutes,
    fc.name AS fare_class,
    ff.base_price,
    ff.available_seats
  FROM 
    flights f
    JOIN airlines a ON f.airline_id = a.id
    JOIN routes r ON f.route_id = r.id
    JOIN airports o ON r.origin_airport_id = o.id
    JOIN airports d ON r.destination_airport_id = d.id
    JOIN cities oc ON o.city_id = oc.id
    JOIN cities dc ON d.city_id = dc.id
    JOIN flight_fares ff ON f.id = ff.flight_id
    JOIN fare_classes fc ON ff.fare_class_id = fc.id
  WHERE 
    r.origin_airport_id = v_origin_airport_id
    AND r.destination_airport_id = v_destination_airport_id
    AND DATE(f.departure_time) = p_departure_date
    AND ff.available_seats >= p_passengers
    AND f.status = 'scheduled'
    AND (v_fare_class_id IS NULL OR ff.fare_class_id = v_fare_class_id)
  ORDER BY 
    f.departure_time;
    
  -- Get return flights if return date is specified
  IF p_return_date IS NOT NULL THEN
    SELECT 
      f.id,
      f.flight_number,
      a.name AS airline_name,
      a.logo_url,
      o.code AS origin_code,
      o.name AS origin_name,
      d.code AS destination_code,
      d.name AS destination_name,
      oc.name AS origin_city,
      dc.name AS destination_city,
      f.departure_time,
      f.arrival_time,
      r.flight_time_minutes,
      fc.name AS fare_class,
      ff.base_price,
      ff.available_seats
    FROM 
      flights f
      JOIN airlines a ON f.airline_id = a.id
      JOIN routes r ON f.route_id = r.id
      JOIN airports o ON r.origin_airport_id = o.id
      JOIN airports d ON r.destination_airport_id = d.id
      JOIN cities oc ON o.city_id = oc.id
      JOIN cities dc ON d.city_id = dc.id
      JOIN flight_fares ff ON f.id = ff.flight_id
      JOIN fare_classes fc ON ff.fare_class_id = fc.id
    WHERE 
      r.origin_airport_id = v_destination_airport_id
      AND r.destination_airport_id = v_origin_airport_id
      AND DATE(f.departure_time) = p_return_date
      AND ff.available_seats >= p_passengers
      AND f.status = 'scheduled'
      AND (v_fare_class_id IS NULL OR ff.fare_class_id = v_fare_class_id)
    ORDER BY 
      f.departure_time;
  END IF;
END //
DELIMITER ;

-- Procedure to create a booking
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateBooking(
  IN p_user_id INT,
  IN p_flight_ids JSON,
  IN p_passenger_details JSON,
  IN p_payment_method_id INT,
  IN p_total_amount DECIMAL(10, 2)
)
BEGIN
  DECLARE v_booking_id INT;
  DECLARE v_booking_reference VARCHAR(10);
  DECLARE v_flight_id INT;
  DECLARE v_fare_class_id INT;
  DECLARE v_passenger_id INT;
  DECLARE i INT DEFAULT 0;
  DECLARE j INT DEFAULT 0;
  DECLARE v_flights_count INT;
  DECLARE v_passengers_count INT;
  DECLARE v_transaction_id VARCHAR(100);
  DECLARE v_passenger_first_name VARCHAR(100);
  DECLARE v_passenger_last_name VARCHAR(100);
  DECLARE v_passenger_dob DATE;
  DECLARE v_passenger_gender VARCHAR(20);
  DECLARE v_passenger_type VARCHAR(10);
  
  -- Start transaction
  START TRANSACTION;
  
  -- Generate unique booking reference
  SET v_booking_reference = CONCAT(
    CHAR(FLOOR(65 + RAND() * 25)), 
    CHAR(FLOOR(65 + RAND() * 25)),
    LPAD(FLOOR(RAND() * 999999), 6, '0')
  );
  
  -- Create booking record
  INSERT INTO bookings (
    user_id, 
    booking_reference, 
    status_id, 
    total_amount, 
    currency, 
    contact_email,
    contact_phone
  ) 
  SELECT 
    p_user_id, 
    v_booking_reference, 
    (SELECT id FROM booking_status WHERE name = 'pending'), 
    p_total_amount, 
    'INR',
    email,
    phone_number
  FROM users 
  WHERE id = p_user_id;
  
  SET v_booking_id = LAST_INSERT_ID();
  
  -- Insert booking status history
  INSERT INTO booking_status_history (
    booking_id, 
    status_id, 
    changed_by
  ) VALUES (
    v_booking_id, 
    (SELECT id FROM booking_status WHERE name = 'pending'), 
    p_user_id
  );
  
  -- Process flights
  SET v_flights_count = JSON_LENGTH(p_flight_ids);
  
  WHILE i < v_flights_count DO
    SET v_flight_id = JSON_EXTRACT(p_flight_ids, CONCAT('$[', i, '].flight_id'));
    SET v_fare_class_id = JSON_EXTRACT(p_flight_ids, CONCAT('$[', i, '].fare_class_id'));
    
    -- Insert booking flights
    INSERT INTO booking_flights (
      booking_id, 
      flight_id, 
      fare_class_id
    ) VALUES (
      v_booking_id, 
      v_flight_id, 
      v_fare_class_id
    );
    
    -- Update available seats
    UPDATE flight_fares 
    SET available_seats = available_seats - (SELECT JSON_LENGTH(p_passenger_details))
    WHERE flight_id = v_flight_id AND fare_class_id = v_fare_class_id;
    
    SET i = i + 1;
  END WHILE;
  
  -- Process passengers
  SET v_passengers_count = JSON_LENGTH(p_passenger_details);
  
  WHILE j < v_passengers_count DO
    SET v_passenger_first_name = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].first_name')));
    SET v_passenger_last_name = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].last_name')));
    SET v_passenger_dob = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].date_of_birth')));
    SET v_passenger_gender = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].gender')));
    SET v_passenger_type = JSON_UNQUOTE(JSON_EXTRACT(p_passenger_details, CONCAT('$[', j, '].passenger_type')));
    
    -- Insert passenger
    INSERT INTO passengers (
      booking_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      passenger_type
    ) VALUES (
      v_booking_id,
      v_passenger_first_name,
      v_passenger_last_name,
      v_passenger_dob,
      v_passenger_gender,
      v_passenger_type
    );
    
    SET j = j + 1;
  END WHILE;
  
  -- Create payment record
  SET v_transaction_id = CONCAT('TXN', LPAD(FLOOR(RAND() * 9999999999), 10, '0'));
  
  INSERT INTO payments (
    booking_id,
    payment_method_id,
    transaction_id,
    amount,
    currency,
    status
  ) VALUES (
    v_booking_id,
    p_payment_method_id,
    v_transaction_id,
    p_total_amount,
    'INR',
    'pending'
  );
  
  -- Return booking ID
  SELECT v_booking_id AS booking_id, v_booking_reference AS booking_reference;
  
  COMMIT;
END //
DELIMITER ;

-- Procedure to check seat availability
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CheckSeatAvailability(
  IN p_flight_id INT,
  IN p_departure_date DATE
)
BEGIN
  SELECT 
    sm.id AS seat_map_id,
    sm.seat_number,
    sm.seat_type,
    fc.name AS fare_class,
    sm.is_emergency_exit,
    sm.is_aisle,
    sm.is_window,
    CASE 
      WHEN ps.id IS NULL THEN TRUE 
      ELSE FALSE 
    END AS is_available
  FROM 
    seat_maps sm
    JOIN aircraft ac ON sm.aircraft_id = ac.id
    JOIN fare_classes fc ON sm.fare_class_id = fc.id
    JOIN flights f ON f.aircraft_id = ac.id
    LEFT JOIN booking_flights bf ON bf.flight_id = f.id
    LEFT JOIN passenger_seats ps ON ps.seat_map_id = sm.id AND ps.booking_flight_id = bf.id
  WHERE 
    f.id = p_flight_id
    AND DATE(f.departure_time) = p_departure_date
    AND sm.is_active = TRUE
  ORDER BY 
    sm.seat_number;
END //
DELIMITER ;

-- Procedure to get booking details
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetBookingDetails(
  IN p_booking_id INT
)
BEGIN
  -- Get booking information
  SELECT 
    b.id,
    b.booking_reference,
    bs.name AS status,
    b.total_amount,
    b.currency,
    b.booking_date,
    b.contact_email,
    b.contact_phone,
    u.email AS user_email,
    u.phone_number AS user_phone,
    up.first_name AS user_first_name,
    up.last_name AS user_last_name
  FROM 
    bookings b
    JOIN users u ON b.user_id = u.id
    JOIN user_profiles up ON u.id = up.user_id
    JOIN booking_status bs ON b.status_id = bs.id
  WHERE 
    b.id = p_booking_id;
    
  -- Get flights information
  SELECT 
    bf.id AS booking_flight_id,
    f.flight_number,
    a.name AS airline_name,
    a.logo_url,
    o.code AS origin_code,
    o.name AS origin_name,
    d.code AS destination_code,
    d.name AS destination_name,
    oc.name AS origin_city,
    dc.name AS destination_city,
    f.departure_time,
    f.arrival_time,
    r.flight_time_minutes,
    fc.name AS fare_class
  FROM 
    booking_flights bf
    JOIN flights f ON bf.flight_id = f.id
    JOIN airlines a ON f.airline_id = a.id
    JOIN routes r ON f.route_id = r.id
    JOIN airports o ON r.origin_airport_id = o.id
    JOIN airports d ON r.destination_airport_id = d.id
    JOIN cities oc ON o.city_id = oc.id
    JOIN cities dc ON d.city_id = dc.id
    JOIN fare_classes fc ON bf.fare_class_id = fc.id
  WHERE 
    bf.booking_id = p_booking_id;
    
  -- Get passengers information
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.passenger_type,
    bf.id AS booking_flight_id,
    ps.id AS passenger_seat_id,
    sm.seat_number,
    sm.seat_type,
    sm.is_emergency_exit,
    sm.is_aisle,
    sm.is_window
  FROM 
    passengers p
    LEFT JOIN passenger_seats ps ON p.id = ps.passenger_id
    LEFT JOIN booking_flights bf ON ps.booking_flight_id = bf.id
    LEFT JOIN seat_maps sm ON ps.seat_map_id = sm.id
  WHERE 
    p.booking_id = p_booking_id;
    
  -- Get payment information
  SELECT 
    p.id,
    p.transaction_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_date,
    pm.name AS payment_method
  FROM 
    payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
  WHERE 
    p.booking_id = p_booking_id;
    
  -- Get baggage information
  SELECT 
    b.id,
    b.baggage_type,
    b.weight_kg,
    b.price,
    p.first_name,
    p.last_name,
    bf.id AS booking_flight_id
  FROM 
    baggage b
    JOIN passengers p ON b.passenger_id = p.id
    JOIN booking_flights bf ON b.booking_flight_id = bf.id
  WHERE 
    p.booking_id = p_booking_id;
END //
DELIMITER ;

