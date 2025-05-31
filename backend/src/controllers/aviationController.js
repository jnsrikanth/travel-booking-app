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
  
  // Calculate max future date (11 months from now)
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 11);
  
  // Check if date is in the past
  if (requestedDate < today) {
    return {
      valid: false,
      message: "The requested date is in the past. Please select a current or future date."
    };
  }
  
  // Check if date is too far in the future (beyond typical airline schedule window)
  if (requestedDate > maxFutureDate) {
    return {
      valid: false,
      message: `The requested date is too far in the future. Most airlines only schedule flights up to 11 months in advance. Max date: ${maxFutureDate.toISOString().split('T')[0]}`
    };
  }
  
  return {
    valid: true,
    message: "Date is within valid range"
  };
};

/**
 * Search for flights based on search criteria
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchFlights = async (req, res) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      travelClass
    } = req.query;

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters: originLocationCode, destinationLocationCode, and departureDate are required'
      });
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
      travelClass: travelClass || 'ECONOMY'
    };

    // Log that we're using the paid API tier which supports future dates
    console.log(`[FLIGHT SEARCH] Using paid AviationStack API tier with future flight schedule support`);
    
    let flights = [];
    let apiResponse = null;
    
    try {
      const result = await aviationStack.searchFlights(searchParams);
      flights = result.flights || [];
      apiResponse = result.apiResponse || null;
      
      console.log(`[FLIGHT SEARCH] Received response from aviationStack: ${flights.length} flights, API metadata:`, 
        apiResponse ? JSON.stringify(apiResponse).substring(0, 200) : 'none');
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
    // If no flights found, provide comprehensive information
    if (flights.length === 0) {
      console.log(`[FLIGHT SEARCH] No flights found for route ${originLocationCode} to ${destinationLocationCode} on ${departureDate}`);
      
      // Return empty array with detailed metadata
      return res.json({
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
          apiResponse: apiResponse,
          possibleReasons: [
            "No scheduled flights exist for this route on the specified date",
            "Airline schedules for this date may not be published yet",
            "The route may not be serviced directly between these airports",
            "The API may have limited data for this specific route or date combination"
          ],
          message: "No flights found for the specified route and date."
        }
      });
    }
    
    // Return flights with enhanced metadata
    res.json({
      flights: flights,
      metadata: {
        count: flights.length,
        requestInfo: {
          origin: originLocationCode,
          destination: destinationLocationCode,
          date: departureDate,
          class: travelClass || 'ECONOMY'
        },
        dateValidation: dateValidation,
        apiResponseSummary: apiResponse ? {
          total: apiResponse.total || 0,
          limit: apiResponse.limit || 100,
          offset: apiResponse.offset || 0
        } : null
      }
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ 
      error: 'Failed to search flights',
      message: error.message 
    });
  }
};

