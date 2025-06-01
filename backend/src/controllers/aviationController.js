/**
 * Aviation Controller
 * 
 * Handles flight and airport search requests using the AviationStack API.
 * Uses a paid tier of AviationStack API which supports comprehensive future flight schedules.
 * Never falls back to mock data - always uses real API data or errors out.
 */
const aviationStack = require('../services/aviationStack');

/**
 * Search for airports based on a keyword
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchAirports = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    console.log(`Processing airport search with keyword: "${keyword}"`);
    
    if (!keyword || keyword.length < 2) {
      console.log('Invalid keyword: too short or missing');
      return res.status(400).json({ 
        error: 'Keyword parameter is required and must be at least 2 characters' 
      });
    }
    
    // Get airports from AviationStack API without fallback to mock data
    let airports = [];
    try {
      airports = await aviationStack.searchAirports(keyword);
      console.log(`Found ${airports.length} airports matching "${keyword}"`);
    } catch (apiError) {
      console.error('Error in aviationStack.searchAirports:', apiError);
      // Error out instead of falling back to mock data
      return res.status(500).json({ 
        error: 'AviationStack API error',
        message: apiError.message 
      });
    }
    
    // Log the response for debugging
    console.log('Airport search response:', JSON.stringify(airports).substring(0, 200) + '...');
    
    return res.json(airports);
  } catch (error) {
    console.error('Airport search error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to search airports',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Validates if a date is within a valid range for airline schedules
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Object} - Validation result with status and message
 */
const validateFlightDate = (dateStr) => {
  const today = new Date();
  const requestedDate = new Date(dateStr);
  
  // Set times to midnight for proper comparison
  today.setHours(0, 0, 0, 0);
  requestedDate.setHours(0, 0, 0, 0);
  
  // Calculate max future date (11 months from now)
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 11);
  maxFutureDate.setHours(0, 0, 0, 0);
  
  // Calculate near-term date (7 days from now)
  const nearTermDate = new Date();
  nearTermDate.setDate(nearTermDate.getDate() + 7);
  nearTermDate.setHours(0, 0, 0, 0);
  
  // Check if date is in the past
  if (requestedDate < today) {
    return {
      valid: false,
      message: "The requested date is in the past. Please select a current or future date.",
      dateCategory: "past"
    };
  }
  
  // Check if date is too far in the future
  if (requestedDate > maxFutureDate) {
    return {
      valid: false,
      message: `The requested date is too far in the future. Airlines typically only schedule flights up to 11 months in advance.`,
      dateCategory: "far_future"
    };
  }
  
  // Check if date is within near-term (next 7 days)
  if (requestedDate <= nearTermDate) {
    return {
      valid: true,
      message: "Date is within near-term range. Real-time flight data available.",
      dateCategory: "near_term"
    };
  }
  
  // Date is valid and in future
  return {
    valid: true,
    message: "Date is within valid range. Future flight schedules will be shown.",
    dateCategory: "future"
  };
};

/**
 * Search for flights based on search criteria
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchFlights = async (req, res) => {
  try {
    // Get the original URL path to check which endpoint was used
    const requestPath = req.path || req.originalUrl || '';
    const isFutureFlightsEndpoint = requestPath.includes('flightsFuture') || req.route?.path?.includes('flightsFuture');
    
    console.log(`[AVIATION CONTROLLER] Request path: ${requestPath}, isFutureFlightsEndpoint: ${isFutureFlightsEndpoint}`);
    
    // Extract parameters based on the endpoint type
    if (isFutureFlightsEndpoint) {
      // For /api/flightsFuture endpoint, use the exact AviationStack API format
      const { iataCode, type, date } = req.query;
      
      console.log(`[AVIATION CONTROLLER] Processing future flights request with exact format:`, {
        iataCode, type, date
      });
      
      // Validate required parameters for the future flights endpoint
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
      
      // Prepare search parameters using the exact format
      const searchParams = {
        iataCode,           // Airport IATA code
        type: type || 'arrival',    // Type of search (arrival or departure)
        date,               // Date in YYYY-MM-DD format
        exactEndpoint: 'flightsFuture' // Flag to use exact API format
      };
      
      try {
        // Call the AviationStack service with the exact parameters
        const result = await aviationStack.searchFlights(searchParams);
        
        // Return a successful response
        return res.json({
          flights: result.flights || [],
          metadata: {
            count: result.flights ? result.flights.length : 0,
            requestInfo: {
              iataCode,
              type: type || 'arrival',
              date,
              class: 'ECONOMY'
            },
            dateValidation: result.dateValidation,
            apiResponse: result.apiResponse,
            ...(result.emptyResultContext && { 
              emptyResultContext: result.emptyResultContext 
            })
          }
        });
      } catch (apiError) {
        console.error('[AVIATION CONTROLLER] Future flights API error:', apiError.message);
        
        // Return a structured error response
        return res.status(500).json({
          flights: [],
          metadata: {
            count: 0,
            requestInfo: {
              iataCode,
              type: type || 'arrival',
              date
            },
            error: "AviationStack API error",
            message: apiError.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    } else {
      // For the standard /api/flights endpoint, use the original implementation
      const {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        travelClass,
        isFutureFlight
      } = req.query;
      
      // Check if this is a future flight search with the flag
      const isFutureFlightSearch = isFutureFlight === 'true';
      
      // For future flight searches, we may have only origin OR destination
      if (isFutureFlightSearch) {
        // For future flights, we need at least one location code and a date
        if ((!originLocationCode && !destinationLocationCode) || !departureDate) {
          return res.status(400).json({
            error: 'Missing required parameters for future flight search',
            message: 'At least one location code (origin or destination) and departureDate are required'
          });
        }
      } else {
        // For regular searches, we need both origin and destination
        if (!originLocationCode || !destinationLocationCode || !departureDate) {
          return res.status(400).json({
            error: 'Missing required parameters: originLocationCode, destinationLocationCode, and departureDate are required'
          });
        }
      }

      // Validate flight date range
      const dateValidation = validateFlightDate(departureDate);
      if (!dateValidation.valid) {
        console.log(`[FLIGHT SEARCH] Invalid date: ${departureDate} - ${dateValidation.message}`);
        return res.status(400).json({
          flights: [],
          metadata: {
            count: 0,
            requestInfo: {
              origin: originLocationCode,
              destination: destinationLocationCode,
              date: departureDate,
              class: travelClass || 'ECONOMY'
            },
            dateValidation: dateValidation,
            error: "Date validation failed",
            message: dateValidation.message
          }
        });
      }

      // Prepare search parameters
      const searchParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults: parseInt(adults || '1', 10),
        travelClass: travelClass || 'ECONOMY',
        isFutureSearch: isFutureFlightSearch
      };

    // Log that we're using the paid API tier which supports future dates
    console.log(`[FLIGHT SEARCH] Using paid AviationStack API tier with future flight schedule support`);
    
    let flights = [];
    let apiResponse = null;
    
    try {
      const result = await aviationStack.searchFlights(searchParams);
      
      // Validate and safely extract flight data
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from aviationStack API');
      }
      
      // Return properly structured response
      return res.json({
        flights: result.flights || [],
        metadata: {
          count: result.flights ? result.flights.length : 0,
          requestInfo: {
            origin: originLocationCode || '',
            destination: destinationLocationCode || '',
            date: departureDate,
            class: travelClass || 'ECONOMY',
            isFutureSearch: isFutureFlightSearch,
            flightType: flightType || 'departure'
          },
          dateValidation: result.dateValidation,
          apiResponse: result.apiResponse,
          ...(result.emptyResultContext && { 
            emptyResultContext: result.emptyResultContext 
          })
        }
      });
    } catch (apiError) {
      console.error('[FLIGHT SEARCH] API error:', apiError);
      return res.status(500).json({
        flights: [],
        metadata: {
          count: 0,
          requestInfo: {
            origin: originLocationCode,
            destination: destinationLocationCode,
            date: departureDate,
            class: travelClass || 'ECONOMY'
          },
          error: "AviationStack API error",
          message: apiError.message
        }
      });
    }
    } // Add the missing closing brace for the else block
  } catch (error) {
    console.error('Flight search error:', error);
    // Return a more structured error response with more details
    res.status(500).json({ 
      flights: [],
      metadata: {
        count: 0,
        requestInfo: {
          origin: originLocationCode || '',
          destination: destinationLocationCode || '',
          date: departureDate || '',
          class: travelClass || 'ECONOMY'
        },
        error: 'Failed to search flights',
        message: error.message,
        timestamp: new Date().toISOString(),
        // Include stack trace in development mode only
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

