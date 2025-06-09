/**
 * Aviation Controller
 * 
 * Handles requests for flight search and airport search, using the aviationStack service.
 * Provides error handling, input validation, and standardized responses.
 */

const aviationService = require('../services/aviationStack');
const redisCache = require('../services/redisCache');

/**
 * Format error response
 * @param {Error} error - The error object
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error) => {
  let statusCode = 500;
  let errorType = 'API Error';
  let message = error.message;
  let details = null;

  // Handle rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('quota')) {
    statusCode = 429;
    errorType = 'Rate Limit Exceeded';
    message = 'Our flight data provider has temporarily limited our requests. Please try again in a few minutes.';
    details = {
      retryAfter: error.response?.headers?.['retry-after'] || '5',
      quotaRemaining: error.response?.headers?.['x-quota-remaining'] || '0'
    };
  }
  // Handle timeout errors
  else if (error.code === 'ECONNABORTED') {
    statusCode = 504;
    errorType = 'Gateway Timeout';
    message = 'The request to our flight data provider timed out. Please try again.';
  }
  // Handle network errors
  else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorType = 'Service Unavailable';
    message = 'Unable to connect to the flight data provider. Please try again later.';
  }

  return {
    statusCode,
    error: {
      type: errorType,
      message,
      details
    }
  };
};

// Validation helpers
const validateDepartureDate = (date) => {
  const departureDate = new Date(date);
  const today = new Date();
  return departureDate >= today;
};

const validateFlightSearchParams = (params) => {
  const { originLocationCode, destinationLocationCode, departureDate } = params;
  
  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    throw new Error('Missing required parameters');
  }

  if (!validateDepartureDate(departureDate)) {
    throw new Error('Departure date must be today or in the future');
  }

  return true;
};

/**
 * Handles flight search requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with flight data or error
 */
const searchFlights = async (req, res) => {
  try {
    const params = {
      originLocationCode: req.query.originLocationCode,
      destinationLocationCode: req.query.destinationLocationCode,
      departureDate: req.query.departureDate,
      adults: parseInt(req.query.adults) || 1,
      travelClass: req.query.travelClass || 'ECONOMY'
    };

    // Validate parameters
    validateFlightSearchParams(params);

    // Get flights using the service
    const flights = await aviationService.searchFlights(params);

    res.json({
      status: 'success',
      data: {
        flights,
        meta: {
          count: flights.length,
          source: await redisCache.getCachedFlights(params) ? 'Cache' : 'API',
          params
        }
      }
    });
  } catch (error) {
    console.error('[CONTROLLER] Flight search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to search flights'
    });
  }
};

/**
 * Handles airport search requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with airport data or error
 */
const searchAirports = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search keyword must be at least 2 characters'
      });
    }

    const airports = await aviationService.searchAirports(keyword);

    res.json({
      status: 'success',
      data: {
        airports,
        meta: {
          count: airports.length,
          source: await redisCache.getCachedAirports(keyword) ? 'Cache' : 'API',
          keyword
        }
      }
    });
  } catch (error) {
    console.error('[CONTROLLER] Airport search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to search airports'
    });
  }
};

/**
 * Handles a request to validate a departure date
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with validation result
 */
const validateDate = async (req, res) => {
  try {
    const { departureDate } = req.query;

    // Validate the date parameter
    if (!departureDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Departure date is required',
        code: 'MISSING_DATE'
      });
    }

    // Call the aviation service to validate the date
    const validation = aviationService.validateDepartureDate(departureDate);

    // Return the validation result
    return res.status(200).json({
      status: 'success',
      data: {
        isValid: validation.valid,
        message: validation.message,
        date: departureDate
      }
    });
  } catch (error) {
    console.error('Date validation error:', error);

    // Return a generic error response
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while validating the date',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Get service health status
 */
const getServiceStatus = async (req, res) => {
  try {
    const apiCalls = await redisCache.getRateLimitStatus();
    
    res.json({
      status: 'success',
      data: {
        redis: {
          connected: redisCache.isConnected,
          apiCalls: {
            today: apiCalls,
            remaining: 100 - apiCalls
          }
        },
        aviationStack: {
          configured: !!process.env.AVIATION_STACK_API_KEY
        }
      }
    });
  } catch (error) {
    console.error('[CONTROLLER] Service status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get service status'
    });
  }
};

// Export controller functions
module.exports = {
  searchFlights,
  searchAirports,
  validateDate,
  getServiceStatus
};

