const express = require('express');
const router = express.Router();
const aviationStack = require('../services/aviationStack');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Search airports
router.get('/airports', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        status: 'error',
        error: 'Keyword is required'
      });
    }

    const result = await aviationStack.searchAirports(keyword);
    res.json(result);
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Search flights
router.get('/flights', async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults = 1,
      travelClass = 'ECONOMY'
    } = req.query;

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate'
      });
    }

    const result = await aviationStack.searchFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: parseInt(adults, 10),
      travelClass
    });

    res.json(result);
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get service status
router.get('/status', (req, res) => {
  try {
    const status = aviationStack.getServiceStatus();
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router; 