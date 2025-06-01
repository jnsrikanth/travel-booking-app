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
  
  // Check if this is a future flight search
  const isFutureSearch = req.query.isFutureSearch === 'true';
  if (isFutureSearch) {
    console.log('Future flight search detected. Using flightsFuture endpoint.');
  }
  
  // Add explicit CORS headers for this public endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Continue to the controller
  aviationController.searchFlights(req, res, next);
});

/**
 * @route   GET /api/flightsFuture
 * @desc    Search for future flights using exact AviationStack API format
 * @access  Public
 */
router.get('/flightsFuture', (req, res, next) => {
  console.log('[FUTURE FLIGHTS] Request received:', req.query);
  
  // Add explicit CORS headers for this public endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  try {
    // Get parameters from AviationStack format
    // http://api.aviationstack.com/v1/flightsFuture?iataCode=JFK&type=arrival&date=2025-07-06
    const { iataCode, type, date } = req.query;
    
    // Validate required parameters
    if (!iataCode) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'iataCode parameter is required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!date) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'date parameter is required (format: YYYY-MM-DD)',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate type parameter
    const validTypes = ['arrival', 'departure'];
    const flightType = type || 'departure'; // Default to departure if not specified
    
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid parameter value',
        message: `type must be one of: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Create a modified request that preserves the original parameters
    // but adds a flag to indicate this is a future flight search
    const modifiedReq = { ...req };
    
    // IMPORTANT: Instead of transforming parameters, pass them through directly
    // with the addition of the isFutureFlight flag
    modifiedReq.query = {
      ...req.query,           // Keep all original parameters intact
      isFutureFlight: true,   // Add a flag to indicate this is a future flight search 
      exactEndpoint: 'flightsFuture' // Indicate which endpoint to use
    };
    
    // Log the exact parameters being sent to the AviationStack API
    console.log(`[FUTURE FLIGHTS] Searching with exact AviationStack format:`);
    console.log(`  Endpoint: /flightsFuture`);
    console.log(`  iataCode: ${iataCode}`);
    console.log(`  type: ${flightType}`);
    console.log(`  date: ${date}`);
    
    // Log the example URL format
    console.log(`[FUTURE FLIGHTS] Example URL: http://api.aviationstack.com/v1/flightsFuture?iataCode=${iataCode}&type=${flightType}&date=${date}`);
    
    // Continue to the controller with modified request that preserves original parameters
    aviationController.searchFlights(modifiedReq, res, next);
  } catch (error) {
    console.error('[FUTURE FLIGHTS] Error processing request:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Error processing future flights request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

