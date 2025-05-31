const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Get all bookings for a user
router.get('/', auth, bookingController.getUserBookings);

// Get a specific booking by ID
router.get('/:id', auth, bookingController.getBookingById);

// Create a new booking
router.post('/', auth, bookingController.createBooking);

// Update booking status
router.patch('/:id/status', auth, bookingController.updateBookingStatus);

// Record flight search (does not require auth)
router.post('/search-history', bookingController.storeFlightSearch);

// Get flight search history (requires auth)
router.get('/search-history', auth, bookingController.getFlightSearchHistory);

module.exports = router;
