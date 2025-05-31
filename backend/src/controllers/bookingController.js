const pool = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a random booking reference
 * @returns {string} Booking reference
 */
const generateBookingReference = () => {
  // Generate a random alphanumeric string of length 8
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBooking = async (req, res) => {
  // Get connection from pool
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();
    
    const { flightId, passenger, totalAmount, currency = 'INR' } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!flightId || !passenger || !totalAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Flight ID, passenger details, and total amount are required' 
      });
    }
    
    // Get currency ID (using INR as default if not found)
    const [currencies] = await connection.query(
      'SELECT id FROM currencies WHERE code = ?',
      [currency]
    );
    
    let currencyId = 1; // Default to INR
    if (currencies.length > 0) {
      currencyId = currencies[0].id;
    }
    
    // Generate booking reference
    const bookingReference = generateBookingReference();
    
    // Insert booking record
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings 
       (user_id, flight_id, booking_reference, booking_status, total_amount, currency_id) 
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [userId, flightId, bookingReference, totalAmount, currencyId]
    );
    
    const bookingId = bookingResult.insertId;
    
    // Get fare class ID (using Economy as default if not found)
    const [fareClasses] = await connection.query(
      'SELECT id FROM fare_classes WHERE name = ?',
      [passenger.class || 'ECONOMY']
    );
    
    let fareClassId = 1; // Default to Economy
    if (fareClasses.length > 0) {
      fareClassId = fareClasses[0].id;
    }
    
    // Insert passenger record
    await connection.query(
      `INSERT INTO passengers 
       (booking_id, first_name, last_name, date_of_birth, passport_number, fare_class_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bookingId, 
        passenger.firstName, 
        passenger.lastName, 
        passenger.dateOfBirth,
        passenger.passportNumber || null,
        fareClassId
      ]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Return success response
    res.status(201).json({
      success: true,
      bookingId: bookingResult.insertId,
      bookingReference,
      message: 'Booking created successfully'
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  } finally {
    // Release connection back to pool
    connection.release();
  }
};

/**
 * Get all bookings for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Query to get all bookings for the user with passenger and flight details
    const [bookings] = await pool.query(
      `SELECT 
        b.id, b.booking_reference, b.booking_status, b.total_amount, 
        b.created_at, b.updated_at,
        c.code as currency_code, c.symbol as currency_symbol,
        f.id as flight_id, f.flight_number, f.departure_date, f.departure_time,
        f.arrival_date, f.arrival_time, f.airline,
        origin.city as origin_city, origin.iata_code as origin_code,
        dest.city as destination_city, dest.iata_code as destination_code,
        p.first_name, p.last_name, p.date_of_birth, p.passport_number,
        fc.name as fare_class
      FROM 
        bookings b
      JOIN 
        currencies c ON b.currency_id = c.id
      JOIN 
        flights f ON b.flight_id = f.id
      JOIN 
        airports origin ON f.origin_id = origin.id
      JOIN 
        airports dest ON f.destination_id = dest.id
      LEFT JOIN 
        passengers p ON b.id = p.booking_id
      JOIN 
        fare_classes fc ON p.fare_class_id = fc.id
      WHERE 
        b.user_id = ?
      ORDER BY 
        b.created_at DESC`,
      [userId]
    );
    
    // Transform the raw data into a more structured format
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.booking_reference,
      status: booking.booking_status,
      totalAmount: booking.total_amount,
      currency: {
        code: booking.currency_code,
        symbol: booking.currency_symbol
      },
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      flight: {
        id: booking.flight_id,
        flightNumber: booking.flight_number,
        airline: booking.airline,
        departureDate: booking.departure_date,
        departureTime: booking.departure_time,
        arrivalDate: booking.arrival_date,
        arrivalTime: booking.arrival_time,
        origin: {
          city: booking.origin_city,
          code: booking.origin_code
        },
        destination: {
          city: booking.destination_city,
          code: booking.destination_code
        }
      },
      passenger: {
        firstName: booking.first_name,
        lastName: booking.last_name,
        dateOfBirth: booking.date_of_birth,
        passportNumber: booking.passport_number,
        fareClass: booking.fare_class
      }
    }));
    
    res.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
};

/**
 * Get a specific booking by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    // Query to get booking details
    const [bookings] = await pool.query(
      `SELECT 
        b.id, b.booking_reference, b.booking_status, b.total_amount, 
        b.created_at, b.updated_at,
        c.code as currency_code, c.symbol as currency_symbol,
        f.id as flight_id, f.flight_number, f.departure_date, f.departure_time,
        f.arrival_date, f.arrival_time, f.airline,
        origin.city as origin_city, origin.iata_code as origin_code,
        dest.city as destination_city, dest.iata_code as destination_code,
        p.first_name, p.last_name, p.date_of_birth, p.passport_number,
        fc.name as fare_class
      FROM 
        bookings b
      JOIN 
        currencies c ON b.currency_id = c.id
      JOIN 
        flights f ON b.flight_id = f.id
      JOIN 
        airports origin ON f.origin_id = origin.id
      JOIN 
        airports dest ON f.destination_id = dest.id
      LEFT JOIN 
        passengers p ON b.id = p.booking_id
      JOIN 
        fare_classes fc ON p.fare_class_id = fc.id
      WHERE 
        b.id = ? AND b.user_id = ?`,
      [bookingId, userId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'No booking found with the given ID for this user'
      });
    }
    
    const booking = bookings[0];
    
    // Format the booking details
    const formattedBooking = {
      id: booking.id,
      bookingReference: booking.booking_reference,
      status: booking.booking_status,
      totalAmount: booking.total_amount,
      currency: {
        code: booking.currency_code,
        symbol: booking.currency_symbol
      },
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      flight: {
        id: booking.flight_id,
        flightNumber: booking.flight_number,
        airline: booking.airline,
        departureDate: booking.departure_date,
        departureTime: booking.departure_time,
        arrivalDate: booking.arrival_date,
        arrivalTime: booking.arrival_time,
        origin: {
          city: booking.origin_city,
          code: booking.origin_code
        },
        destination: {
          city: booking.destination_city,
          code: booking.destination_code
        }
      },
      passenger: {
        firstName: booking.first_name,
        lastName: booking.last_name,
        dateOfBirth: booking.date_of_birth,
        passportNumber: booking.passport_number,
        fareClass: booking.fare_class
      }
    };
    
    res.json({
      success: true,
      booking: formattedBooking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      message: error.message
    });
  }
};

/**
 * Update booking status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBookingStatus = async (req, res) => {
  // Get connection from pool
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Check if booking exists and belongs to user
    const [bookings] = await connection.query(
      'SELECT id FROM bookings WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'No booking found with the given ID for this user'
      });
    }
    
    // Update booking status
    await connection.query(
      'UPDATE bookings SET booking_status = ? WHERE id = ?',
      [status, id]
    );
    
    // Commit transaction
    await connection.commit();
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}`
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      message: error.message
    });
  } finally {
    // Release connection back to pool
    connection.release();
  }
};

/**
 * Store flight search history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const storeFlightSearch = async (req, res) => {
  try {
    const { origin, destination, departureDate, adults, travelClass } = req.body;
    const userId = req.user?.id || null; // User might not be authenticated
    
    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Origin, destination, and departure date are required'
      });
    }
    
    // Insert flight search history
    const [result] = await pool.query(
      `INSERT INTO flight_searches 
       (user_id, origin, destination, departure_date, adults, travel_class) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, origin, destination, departureDate, adults || 1, travelClass || 'ECONOMY']
    );
    
    res.status(201).json({
      success: true,
      searchId: result.insertId,
      message: 'Flight search recorded successfully'
    });
  } catch (error) {
    console.error('Error recording flight search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record flight search',
      message: error.message
    });
  }
};

/**
 * Get flight search history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFlightSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Query to get search history for the user
    const [searches] = await pool.query(
      `SELECT 
        id, origin, destination, departure_date, adults, travel_class, created_at
      FROM 
        flight_searches
      WHERE 
        user_id = ?
      ORDER BY 
        created_at DESC
      LIMIT 10`,
      [userId]
    );
    
    // Format the search history
    const formattedSearches = searches.map(search => ({
      id: search.id,
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departure_date,
      adults: search.adults,
      travelClass: search.travel_class,
      searchedAt: search.created_at
    }));
    
    res.json({
      success: true,
      count: formattedSearches.length,
      searches: formattedSearches
    });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history',
      message: error.message
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  storeFlightSearch,
  getFlightSearchHistory
};

