const express = require('express');
const router = express.Router();
const aviationController = require('../controllers/aviationController');

/**
 * @route   GET /api/airports
 * @desc    Search for airports by keyword
 * @access  Public
 */
router.get('/airports', (req, res, next) => {
  console.log('Airport search request received:', req.query);
  
  // Add explicit CORS headers for this public endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Continue to the controller
  aviationController.searchAirports(req, res, next);
});

/**
 * @route   GET /api/flights
 * @desc    Search for flights based on search criteria
 * @access  Public
 */
router.get('/flights', (req, res, next) => {
  console.log('Flight search request received:', req.query);
  
  // Add explicit CORS headers for this public endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Continue to the controller
  aviationController.searchFlights(req, res, next);
});

/**
 * Error handling middleware
 */
router.use((err, req, res, next) => {
  console.error('Aviation routes error:', err);
  console.error('Error stack:', err.stack);
  
  // Send a more detailed error response
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

