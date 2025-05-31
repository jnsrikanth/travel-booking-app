const express = require('express');
const cors = require('cors');
const aviationService = require('./services/aviationStack');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Configure middleware with permissive CORS
app.use(cors({
  origin: '*',  // Allow all origins temporarily
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`Query params:`, req.query);
  console.log(`Headers:`, req.headers);
  next();
});

// Simplified direct airport search endpoint - no dependencies
app.get('/api/airports', async (req, res, next) => {
  try {
    const { keyword } = req.query;
    console.log(`[AIRPORT SEARCH] Processing search with keyword: "${keyword}"`);
    
    if (!keyword || keyword.length < 2) {
      console.log('Invalid keyword: too short or missing');
      return res.status(400).json({ 
        error: 'Keyword parameter is required and must be at least 2 characters' 
      });
    }
    
    // Use AviationStack API (or mock data if explicitly enabled)
    const airports = await aviationService.searchAirports(keyword);
    console.log(`[AIRPORT SEARCH] Found ${airports.length} airports for "${keyword}"`);
    
    // Log sample of the response
    console.log('Airport search response sample:', 
      airports.length > 0 ? JSON.stringify(airports.slice(0, 2)) : '[]');
    
    return res.json(airports);
  } catch (error) {
    console.error(`[AIRPORT SEARCH] Error searching airports:`, error);
    next(error);
  }
});

// Flight search endpoint
app.get('/api/flights', async (req, res, next) => {
  try {
    const { 
      originLocationCode, 
      destinationLocationCode, 
      departureDate,
      adults = 1,
      travelClass = 'ECONOMY'
    } = req.query;

    console.log(`[FLIGHT SEARCH] Processing flight search with parameters:`, {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
      travelClass
    });

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      console.error('[FLIGHT SEARCH] Missing required parameters');
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'originLocationCode, destinationLocationCode, and departureDate are required',
        timestamp: new Date().toISOString(),
        dataSource: aviationService.isMockEnabled ? 'mock' : 'AviationStack API'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate)) {
      console.error(`[FLIGHT SEARCH] Invalid date format: ${departureDate}`);
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'departureDate must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        dataSource: aviationService.isMockEnabled ? 'mock' : 'AviationStack API'
      });
    }

    // Validate travel class
    const validTravelClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    let useTravelClass = travelClass;
    if (!validTravelClasses.includes(useTravelClass)) {
      console.warn(`[FLIGHT SEARCH] Invalid travel class: ${useTravelClass}, defaulting to ECONOMY`);
      useTravelClass = 'ECONOMY';
    }

    // Search flights using AviationStack API or fallback
    const searchParams = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      travelClass: useTravelClass,
      adults: parseInt(adults, 10) || 1
    };

    console.log(`[FLIGHT SEARCH] Searching flights with params:`, searchParams);
    
    try {
      const flights = await aviationService.searchFlights(searchParams);
      console.log(`[FLIGHT SEARCH] Found ${flights.length} flights for route ${originLocationCode} to ${destinationLocationCode}`);
      
      // Log a sample of the response (first flight only)
      if (flights.length > 0) {
        console.log(`[FLIGHT SEARCH] Sample flight:`, {
          flightNumber: flights[0].flightNumber,
          airline: flights[0].airline,
          departureTime: flights[0].departureTime,
          price: flights[0].price,
          isMockData: flights[0].isMockData
        });
      }
      
      // Log metadata for debugging purposes
      console.log(`[FLIGHT SEARCH] Response metadata:`, {
        count: flights.length,
        source: flights[0]?.isMockData ? 'mock' : 'AviationStack API',
        timestamp: new Date().toISOString()
      });
      
      // Return the flights array directly to match frontend expectations
      return res.json(flights);
    } catch (error) {
      console.error(`[FLIGHT SEARCH] Error searching flights:`, error);
      throw new Error(`Failed to search flights: ${error.message}`);
    }
  } catch (error) {
    console.error(`[FLIGHT SEARCH] Unexpected error:`, error);
    next(error); // Pass to global error handler
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    aviation: aviationService.getServiceStatus(),
    apiKey: process.env.AVIATION_STACK_API_KEY ? 'configured' : 'missing',
    mockDataEnabled: process.env.USE_MOCK_DATA === 'true'
  });
});

// Test endpoint to check API
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

// Global error handler with detailed logging
app.use((err, req, res, next) => {
  console.error('=== ERROR DETAILS ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Query:', req.query);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('===================');
  
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`=== SIMPLIFIED BACKEND SERVER ===`);
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`AviationStack API key: ${process.env.AVIATION_STACK_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`Mock data mode: ${process.env.USE_MOCK_DATA === 'true' ? 'Enabled ⚠️' : 'Disabled ✅'}`);
  console.log(`Data source: ${aviationService.isMockEnabled ? 'MOCK DATA (explicitly enabled)' : 'AviationStack API (default)'}`);
  console.log(`Open http://localhost:${port}/test to verify the API is working`);
  console.log(`Open http://localhost:${port}/api/airports?keyword=DFW to test airport search`);
  console.log(`Open http://localhost:${port}/api/flights?originLocationCode=DFW&destinationLocationCode=LAX&departureDate=2025-05-30&adults=1&travelClass=ECONOMY to test flight search`);
  console.log(`Open http://localhost:${port}/health to check service status`);
  console.log(`=========================================`);
});
