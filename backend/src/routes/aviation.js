const express = require('express');
const router = express.Router();
const aviationStack = require('../services/aviationStack');
const apiResilience = require('../services/apiResilience');
const aviationService = require('../services/aviationService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/airports
 * @desc    Search for airports by keyword
 * @access  Public
 */
router.get('/airports', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    // Validate input
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Keyword must be at least 2 characters long',
        airports: []
      });
    }
    
    const airports = await aviationStack.searchAirports(keyword);
    
    if (!airports || airports.length === 0) {
      return res.json({
        status: 'success',
        message: `No airports found for "${keyword}"`,
        airports: []
      });
    }
    
    // Always wrap the response in a 'data' object
    res.json({
      status: 'success',
      data: {
        airports: airports,
        meta: {
          count: airports.length,
          keyword: keyword,
          timestamp: new Date().toISOString(),
          source: 'AviationStack API'
        }
      }
    });
  } catch (error) {
    console.error('[BACKEND_ROUTE] Error searching airports:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while searching airports',
      airports: []
    });
  }
});

/**
 * @route   GET /api/flights
 * @desc    Search for flights based on search criteria
 * @access  Public
 */
router.get('/flights', async (req, res) => {
  try {
    const { originLocationCode, destinationLocationCode, departureDate, adults, travelClass } = req.query;
    
    const flights = await aviationStack.searchFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
      travelClass
    });
    res.json({ status: 'success', data: { flights } });
  } catch (error) {
    logger.error(`[API] Error searching flights: ${error.message}`);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      note: 'Future flight searches require the paid tier AviationStack API. Ensure your API key has appropriate permissions.'
    });
  }
});

/**
 * @route   GET /api/flightsFuture
 * @desc    Search for future flights using exact AviationStack API format
 * @access  Public
 */
router.get('/flightsFuture', async (req, res) => {
  try {
    const { originLocationCode, destinationLocationCode, departureDate } = req.query;
    console.log('[ROUTE][flightsFuture] Incoming params:', { originLocationCode, destinationLocationCode, departureDate });
    const result = await aviationStack.searchFutureFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate
    });
    console.log('[ROUTE][flightsFuture] Result from aviationStack:', result);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Future flight search error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      note: 'Future flight searches require the paid tier AviationStack API. Ensure your API key has appropriate permissions.'
    });
  }
});

/**
 * @route   GET /api/status
 * @desc    Get API service status including resilience metrics
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const resilienceStatus = apiResilience.getStatus();
    const aviationStatus = aviationStack.getServiceStatus();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      services: {
        aviationStack: aviationStatus,
        resilience: resilienceStatus
      }
    });
  } catch (error) {
    console.error('[API] Status check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get service status',
      error: error.message
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

