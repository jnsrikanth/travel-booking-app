-- Triggers for auditing and automatic updates

-- Trigger for booking status history
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_booking_status_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status_id != NEW.status_id THEN
    INSERT INTO booking_status_history (
      booking_id,
      status_id,
      changed_at,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status_id,
      NOW(),
      NULL,
      'Status updated automatically'
    );
  END IF;
END //
DELIMITER ;

-- Trigger for price history tracking
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_flight_fare_update
AFTER UPDATE ON flight_fares
FOR EACH ROW
BEGIN
  IF OLD.base_price != NEW.base_price OR OLD.available_seats != NEW.available_seats THEN
    INSERT INTO price_history (
      flight_id,
      fare_class_id,
      price,
      available_seats,
      recorded_at
    ) VALUES (
      NEW.flight_id,
      NEW.fare_class_id,
      NEW.base_price,
      NEW.available_seats,
      NOW()
    );
  END IF;
END //
DELIMITER ;

-- Trigger for payment status update
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_payment_status_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'completed' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'confirmed')
      WHERE id = NEW.booking_id;
    ELSEIF NEW.status = 'failed' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'payment_failed')
      WHERE id = NEW.booking_id;
    ELSEIF NEW.status = 'refunded' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'cancelled')
      WHERE id = NEW.booking_id;
    END IF;
  END IF;
END //
DELIMITER ;

-- Triggers for auditing and automatic updates

-- Trigger for booking status history
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_booking_status_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status_id != NEW.status_id THEN
    INSERT INTO booking_status_history (
      booking_id,
      status_id,
      changed_at,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status_id,
      NOW(),
      NULL,
      'Status updated automatically'
    );
  END IF;
END //
DELIMITER ;

-- Trigger for price history tracking
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_flight_fare_update
AFTER UPDATE ON flight_fares
FOR EACH ROW
BEGIN
  IF OLD.base_price != NEW.base_price OR OLD.available_seats != NEW.available_seats THEN
    INSERT INTO price_history (
      flight_id,
      fare_class_id,
      price,
      available_seats,
      recorded_at
    ) VALUES (
      NEW.flight_id,
      NEW.fare_class_id,
      NEW.base_price,
      NEW.available_seats,
      NOW()
    );
  END IF;
END //
DELIMITER ;

-- Trigger for payment status update
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_payment_status_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'completed' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'confirmed')
      WHERE id = NEW.booking_id;
    ELSEIF NEW.status = 'failed' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'payment_failed')
      WHERE id = NEW.booking_id;
    ELSEIF NEW.status = 'refunded' THEN
      UPDATE bookings
      SET status_id = (SELECT id FROM booking_status WHERE name = 'cancelled')
      WHERE id = NEW.booking_id;
    END IF;
  END IF;
END //
DELIMITER ;

