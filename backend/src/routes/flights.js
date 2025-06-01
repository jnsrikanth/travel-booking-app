const express = require('express');
const router = express.Router();
const aviationStack = require('../services/aviationStack');

// Add at the beginning of the routes
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Flight search API is working',
    timestamp: new Date().toISOString(),
    config: {
      apiUrl: process.env.AVIATION_STACK_API_URL,
      apiKeyConfigured: !!process.env.AVIATION_STACK_API_KEY
    }
  });
});

// GET route for flight search
router.get('/', async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      travelClass,
      isFutureSearch
    } = req.query;

    // Normalize isFutureSearch parameter to ensure consistent handling
    const normalizedIsFutureSearch = 
      isFutureSearch === 'true' || isFutureSearch === true || isFutureSearch === '1';

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'originLocationCode, destinationLocationCode, and departureDate are required'
      });
    }

    // Check if this is a future date search
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for proper comparison
    const searchDate = new Date(departureDate);
    searchDate.setHours(0, 0, 0, 0);
    
    // Determine if this is a future flight request based on:
    // 1. Explicit isFutureSearch parameter (from frontend)
    // 2. Date comparison (as a fallback)
    const isFutureRequest = normalizedIsFutureSearch || (searchDate > today);
    
    // Enhanced logging for future flight detection
    console.log('[FLIGHT SEARCH] Future flight detection:', { 
      originalParam: isFutureSearch,
      normalizedParam: normalizedIsFutureSearch,
      searchDate: searchDate.toISOString(),
      today: today.toISOString(),
      dateComparison: searchDate > today,
      isFutureRequest
    });
    
    console.log('[FLIGHT SEARCH] Searching with params:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      travelClass,
      isFutureRequest
    });
    
    // If this is a future request, add logging
    if (isFutureRequest) {
      console.log(`[FLIGHT SEARCH] Future flight search detected for date: ${departureDate}`);
    }

    const result = await aviationStack.searchFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults: parseInt(adults || '1', 10),
      travelClass: travelClass || 'ECONOMY',
      isFutureRequest, // Pass the flag to the aviationStack service
      flightType: isFutureRequest ? 'future' : 'current' // Add explicit flight type for clarity
    });

    return res.json({
      flights: result.flights || [],
      metadata: {
        count: result.flights ? result.flights.length : 0,
        requestInfo: {
          origin: originLocationCode,
          destination: destinationLocationCode,
          date: departureDate,
          class: travelClass || 'ECONOMY'
        },
        dateValidation: result.dateValidation,
        apiResponse: result.apiResponse,
        ...(result.emptyResultContext && { 
          emptyResultContext: result.emptyResultContext 
        })
      }
    });
  } catch (error) {
    console.error('[FLIGHT SEARCH] Error:', error.message);
    return res.status(500).json({
      flights: [],
      metadata: {
        count: 0,
        error: 'Error in flight search response',
        message: error.message,
        details: error.response?.data || null
      }
    });
  }
});

// POST route for flight search
router.post('/search', async (req, res) => {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      passengers,
      class: travelClass
    } = req.body;

    const searchParams = {
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate,
      returnDate,
      adults: passengers,
      travelClass
    };

    console.log('[FLIGHT SEARCH] Searching with params:', searchParams);

    const result = await aviationStack.searchFlights(searchParams);
    
    // Ensure we have a valid flights array in the response
    const flights = result.flights || [];
    
    console.log(`[FLIGHT SEARCH] Found ${flights.length} flights for route ${from} to ${to}`);
    
    const response = {
      data: flights,
      meta: {
        count: flights.length,
        source: 'AviationStack API',
        timestamp: new Date().toISOString()
      }
    };

    if (flights.length === 0 && result.emptyResultContext) {
      response.meta.context = result.emptyResultContext;
    }

    res.json(response);
  } catch (error) {
    console.error('[FLIGHT SEARCH] Error:', error.message);
    res.status(500).json({
      error: 'Error in flight search response',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// GET route for future flights
router.get('/future', async (req, res) => {
  try {
    const {
      originLocationCode, // Origin airport IATA code
      destinationLocationCode, // Destination airport IATA code
      departureDate, // Date in YYYY-MM-DD format
      travelClass = 'ECONOMY' // Optional travel class
    } = req.query;

    // Validate required parameters
    if (!originLocationCode || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Origin airport code and departure date are required',
        requiredParams: ['originLocationCode', 'departureDate']
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Departure date must be in YYYY-MM-DD format',
        providedDate: departureDate
      });
    }

    // Ensure the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(departureDate);
    requestDate.setHours(0, 0, 0, 0);

    if (requestDate <= today) {
      return res.status(400).json({
        error: 'Invalid future date',
        message: 'The departure date must be in the future',
        providedDate: departureDate,
        currentDate: today.toISOString().split('T')[0]
      });
    }

    console.log('[FUTURE FLIGHT SEARCH] Searching future flights with params:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      travelClass
    });

    // Call the aviation stack service with explicit future flight flag
    const result = await aviationStack.searchFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      travelClass: travelClass || 'ECONOMY',
      isFutureRequest: true // Explicitly set future request flag
    });

    const flights = result.flights || [];
    
    console.log(`[FUTURE FLIGHT SEARCH] Found ${flights.length} future flights for route ${originLocationCode} to ${destinationLocationCode} on ${departureDate}`);
    
    return res.json({
      flights: flights,
      metadata: {
        count: flights.length,
        requestInfo: {
          origin: originLocationCode,
          destination: destinationLocationCode,
          date: departureDate,
          class: travelClass || 'ECONOMY',
          flightType: 'future'
        },
        dateValidation: result.dateValidation,
        apiResponse: result.apiResponse,
        ...(result.emptyResultContext && { 
          emptyResultContext: result.emptyResultContext 
        })
      }
    });
  } catch (error) {
    console.error('[FUTURE FLIGHT SEARCH] Error:', error.message);
    
    // Handle specific error cases for future flights
    if (error.message.includes('future') || 
        error.message.includes('schedule') || 
        error.message.includes('date')) {
      return res.status(400).json({
        flights: [],
        metadata: {
          count: 0,
          error: 'Future flight schedule error',
          message: error.message,
          details: error.response?.data || null
        }
      });
    }
    
    return res.status(500).json({
      flights: [],
      metadata: {
        count: 0,
        error: 'Error in future flight search',
        message: error.message,
        details: error.response?.data || null
      }
    });
  }
});

// POST route for future flights
router.post('/future/search', async (req, res) => {
  try {
    const {
      from, // Origin airport IATA code
      to, // Destination airport IATA code
      departureDate, // Date in YYYY-MM-DD format
      class: travelClass = 'ECONOMY' // Optional travel class
    } = req.body;

    // Validate required parameters
    if (!from || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Origin airport code (from) and departure date are required',
        requiredParams: ['from', 'departureDate']
      });
    }

    const searchParams = {
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate,
      travelClass,
      isFutureRequest: true // Explicitly set future request flag
    };

    console.log('[FUTURE FLIGHT SEARCH] Searching with params:', searchParams);

    const result = await aviationStack.searchFlights(searchParams);
    
    const flights = result.flights || [];
    
    console.log(`[FUTURE FLIGHT SEARCH] Found ${flights.length} future flights for route ${from} to ${to} on ${departureDate}`);
    
    const response = {
      data: flights,
      meta: {
        count: flights.length,
        source: 'AviationStack API - Future Flights',
        flightType: 'future',
        timestamp: new Date().toISOString()
      }
    };

    if (flights.length === 0 && result.emptyResultContext) {
      response.meta.context = result.emptyResultContext;
    }

    res.json(response);
  } catch (error) {
    console.error('[FUTURE FLIGHT SEARCH] Error:', error.message);
    
    // Determine appropriate status code based on error type
    const statusCode = error.message.includes('Invalid') || 
                       error.message.includes('required') || 
                       error.message.includes('future date') ? 400 : 500;
    
    res.status(statusCode).json({
      error: 'Error in future flight search',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// Search airports
router.get('/airports', async (req, res) => {
  try {
    const { keyword } = req.query;
    console.log(`[AIRPORT SEARCH] Searching airports with keyword: ${keyword}`);
    
    const airports = await aviationStack.searchAirports(keyword);
    
    const response = {
      data: airports,
      meta: {
        count: airports.length,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('[AIRPORT SEARCH] Error:', error.message);
    res.status(500).json({
      error: 'Failed to search airports',
      message: error.message
    });
  }
});

module.exports = router;
