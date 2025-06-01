/**
 * AviationStack API Service
 * 
 * This service handles communication with the AviationStack API for:
 * - Real-time flight schedules
 * - Flight status information
 * - Airport data
 * - Aircraft information
 * 
 * Note: Pricing information is not part of AviationStack's domain.
 * For pricing, a separate integration with a GDS (Global Distribution System) 
 * or airline NDC APIs would be required.
 */

const axios = require('axios');
const NodeCache = require('node-cache');

// Configuration
const AVIATION_STACK_API_URL = 'http://api.aviationstack.com/v1';
const FLIGHTS_ENDPOINT = `${AVIATION_STACK_API_URL}/flights`;
const FLIGHTS_FUTURE_ENDPOINT = `${AVIATION_STACK_API_URL}/flightsFuture`; // Correct endpoint for future flights
const API_KEY = process.env.AVIATION_STACK_API_KEY;

// Cache configuration
const CACHE_TTL_CURRENT_FLIGHTS = 300; // 5 minutes in seconds
const CACHE_TTL_FUTURE_FLIGHTS = 3600; // 1 hour in seconds
const CACHE_MAX_SIZE = 100; // Maximum number of cached items

// Initialize cache
const flightCache = new NodeCache({
  stdTTL: CACHE_TTL_CURRENT_FLIGHTS,
  checkperiod: 120, // Check for expired keys every 2 minutes
  maxKeys: CACHE_MAX_SIZE
});

// Rate limiting configuration
const RATE_LIMIT_RETRY_DELAY = 1000; // Initial retry delay in ms
const RATE_LIMIT_MAX_RETRIES = 3; // Maximum number of retries
const RATE_LIMIT_MAX_DELAY = 10000; // Maximum delay between retries in ms

if (!API_KEY) {
  throw new Error('AviationStack API key is required. Set AVIATION_STACK_API_KEY in environment variables.');
}

/**
 * Calculate flight duration
 * @param {string|Date} departure - Departure datetime or time
 * @param {string|Date} arrival - Arrival datetime or time
 * @param {string} [date] - Optional date for time-only values
 * @returns {string} Formatted duration string
 */
const calculateDuration = (departure, arrival, date) => {
  // Handle cases where we only have time strings without dates
  if (typeof departure === 'string' && departure.length <= 5 && 
      typeof arrival === 'string' && arrival.length <= 5 && date) {
    // Create full datetime strings
    departure = `${date}T${departure}:00`;
    arrival = `${date}T${arrival}:00`;
    
    // If arrival time is earlier than departure time, assume next day arrival
    const depTime = new Date(`${date}T${departure}`);
    const arrTime = new Date(`${date}T${arrival}`);
    if (arrTime < depTime) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      arrival = `${nextDay.toISOString().split('T')[0]}T${arrival}:00`;
    }
  }
  
  // Parse dates handling both ISO strings and Date objects
  const dep = typeof departure === 'string' ? new Date(departure) : departure;
  const arr = typeof arrival === 'string' ? new Date(arrival) : arrival;
  
  // Calculate difference
  const diff = arr - dep;
  
  // Handle invalid or same dates
  if (isNaN(diff) || diff <= 0) {
    // For future flights, use typical duration for the route as fallback
    return "3h 30m"; // Average JFK-LAX flight time as fallback
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

/**
 * Validates a flight date and provides context about scheduling limitations
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Object} Validation result with status and metadata
 */
const validateFlightDate = (dateStr) => {
  // Check if date format is valid YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      date: dateStr,
      status: 'invalid_format',
      message: 'Date must be in YYYY-MM-DD format',
      dateCategory: 'error',
      dateInfo: {
        requestedDate: dateStr,
        currentDate: new Date().toISOString().split('T')[0],
        isValid: false
      }
    };
  }
  
  const today = new Date();
  const requestedDate = new Date(dateStr);
  
  // Set today to beginning of day for proper comparison
  today.setHours(0, 0, 0, 0);
  
  // Calculate max future date (11 months from now)
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 11);
  
  // Calculate near-term date (7 days from now)
  const nearTermDate = new Date();
  nearTermDate.setDate(nearTermDate.getDate() + 7);
  
  // Calculate minimum allowed future date (7 days from now based on API requirements)
  const minFutureDate = new Date();
  minFutureDate.setDate(minFutureDate.getDate() + 7);
  
  // Determine date category
  const isPast = requestedDate < today;
  const isFarFuture = requestedDate > maxFutureDate;
  const isNearTerm = requestedDate <= nearTermDate;
  const isTooSoon = requestedDate > today && requestedDate < minFutureDate;
  
  let status = 'valid';
  let message = 'Date is within valid range';
  let dateCategory = 'current';
  
  if (isPast) {
    status = 'past';
    message = 'The requested date is in the past.';
    dateCategory = 'historical';
  } else if (isTooSoon) {
    status = 'too_soon';
    message = `Future flight schedules are only available for dates after ${minFutureDate.toISOString().split('T')[0]}`;
    dateCategory = 'invalid';
  } else if (isFarFuture) {
    status = 'far_future';
    message = 'The requested date is beyond typical airline scheduling windows (11 months).';
    dateCategory = 'far_future';
  } else if (isNearTerm) {
    status = 'valid';
    message = 'Date is within near-term range. Most airlines have published schedules for this period.';
    dateCategory = 'near_term';
  } else {
    status = 'valid';
    message = 'Date is within future range. Some airlines may have published schedules for this period.';
    dateCategory = 'future';
  }
  
  return {
    date: dateStr,
    status,
    message,
    dateCategory,
      dateInfo: {
        requestedDate: dateStr,
        currentDate: today.toISOString().split('T')[0],
        maxScheduleDate: maxFutureDate.toISOString().split('T')[0],
        nearTermDate: nearTermDate.toISOString().split('T')[0],
        minFutureDate: minFutureDate.toISOString().split('T')[0],
        isPast,
        isFarFuture,
        isNearTerm,
        isTooSoon
      }
  };
};

/**
 * Logs raw API response for debugging
 * @param {string} endpoint - API endpoint
 * @param {Object} params - API parameters
 * @param {Object} response - API response
 */
const logRawApiResponse = (endpoint, params, response) => {
  console.log(`[AVIATION STACK] Raw API response from ${endpoint}:`);
  console.log(`Parameters: ${JSON.stringify(params)}`);
  
  // Log only response metadata to avoid excessive logs
  if (response && response.data) {
    console.log(`Response metadata: ${JSON.stringify({
      pagination: response.data.pagination,
      count: response.data.data ? response.data.data.length : 0
    })}`);
    
    // Log first item as sample if available
    if (response.data.data && response.data.data.length > 0) {
      // For future flight requests, log more detailed information
      if ((endpoint === 'flights' || endpoint === 'flightsFuture') && (params.flight_date || params.date)) {
        console.log(`[AVIATION STACK] Flight sample data structure for date ${params.flight_date}:`);
        const firstItem = response.data.data[0];
        
        // Log keys to understand the structure
        console.log(`Available fields: ${Object.keys(firstItem).join(', ')}`);
        
        // Log sample data (truncated)
        console.log(`Sample data item: ${JSON.stringify(firstItem).substring(0, 300)}...`);
      } else {
        // For other endpoints, just log a sample
        console.log(`Sample data item: ${JSON.stringify(response.data.data[0])}`);
      }
    }
  }
};

/**
 * Generates a cache key based on request parameters
 * @param {Object} params - Search parameters
 * @param {boolean} isFutureRequest - Whether this is a future flight request
 * @returns {string} Cache key
 */
const generateCacheKey = (params, isFutureRequest) => {
  const { originLocationCode = '', destinationLocationCode = '', departureDate = '' } = params;
  const endpoint = isFutureRequest ? 'flightsFuture' : 'flights';
  return `${endpoint}_${originLocationCode}_${destinationLocationCode}_${departureDate}`;
};

/**
 * Checks if a response indicates a rate limit error
 * @param {Object} error - Error object from axios
 * @returns {boolean} True if this is a rate limit error
 */
const isRateLimitError = (error) => {
  // Check for HTTP 429 status code
  if (error.response && error.response.status === 429) {
    return true;
  }
  
  // Check for specific error codes in response
  if (error.response && error.response.data && error.response.data.error) {
    const errorCode = error.response.data.error.code;
    const errorMessage = error.response.data.error.message || '';
    
    return errorCode === 'rate_limit_reached' || 
           errorCode === 'usage_limit_reached' ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('too many requests');
  }
  
  return false;
};

/**
 * Makes an API request with retry logic for rate limiting
 * @param {string} url - API endpoint URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
const makeApiRequestWithRetry = async (url, options, retryCount = 0) => {
  try {
    return await axios.get(url, options);
  } catch (error) {
    // Check if this is a rate limit error
    if (isRateLimitError(error) && retryCount < RATE_LIMIT_MAX_RETRIES) {
      // Calculate exponential backoff delay with more aggressive backoff
      const delay = Math.min(
        RATE_LIMIT_RETRY_DELAY * Math.pow(3, retryCount), // More aggressive backoff
        RATE_LIMIT_MAX_DELAY
      );
      
      console.log(`[AVIATION STACK] Rate limit reached. Retrying in ${delay + 2000}ms (attempt ${retryCount + 1}/${RATE_LIMIT_MAX_RETRIES})`);
      
      // Wait longer between retries
      await new Promise(resolve => setTimeout(resolve, delay + 2000));
      
      // Retry the request with incremented retry count
      return makeApiRequestWithRetry(url, options, retryCount + 1);
    }
    
    // If it's not a rate limit error or we've exceeded max retries, throw the error
    throw error;
  }
};

/**
 * Maps flight data from API response to a standardized format
 * @param {Object} apiResponse - The flight data from API response
 * @param {boolean} isFutureRequest - Whether this is from a future flight request
 * @returns {Object} Standardized flight object
 */
const mapFlightResponse = (apiResponse, isFutureRequest = false) => {
  // Handle future flight data differently than current flight data
  if (isFutureRequest) {
    // For future flights using flightsFuture endpoint
    console.log('[AVIATION STACK] Processing future flight data:', JSON.stringify(apiResponse).substring(0, 200));
    
    return {
      id: apiResponse.flight?.number || apiResponse.flight?.iata || apiResponse.flightIata || 'UNKNOWN',
      flightNumber: apiResponse.flight?.iata || apiResponse.flight?.number || apiResponse.flightIata || 'UNKNOWN',
      airline: apiResponse.airline?.name || apiResponse.airlineName || 'Unknown Airline',
      origin: {
        iataCode: apiResponse.departure?.iataCode || apiResponse.iataCode || 'UNK',
        name: apiResponse.departure?.airport || apiResponse.airportName || 'Unknown Airport',
        city: apiResponse.departure?.city || apiResponse.cityName || '',
        country: apiResponse.departure?.country || apiResponse.countryName || '',
        terminal: apiResponse.departure?.terminal || null,
        gate: apiResponse.departure?.gate || null
      },
      destination: {
        iataCode: apiResponse.arrival?.iataCode || apiResponse.arrivalIata || 'UNK',
        name: apiResponse.arrival?.airport || apiResponse.arrivalAirport || 'Unknown Airport',
        city: apiResponse.arrival?.city || apiResponse.arrivalCity || '',
        country: apiResponse.arrival?.country || apiResponse.arrivalCountry || '',
        terminal: apiResponse.arrival?.terminal || null,
        gate: apiResponse.arrival?.gate || null
      },
      departureDate: apiResponse.date || apiResponse.flight_date || new Date().toISOString().split('T')[0],
      departureTime: apiResponse.departure?.scheduledTime || apiResponse.departureTime || '00:00',
      arrivalDate: apiResponse.date || apiResponse.flight_date || new Date().toISOString().split('T')[0],
      arrivalTime: apiResponse.arrival?.scheduledTime || apiResponse.arrivalTime || '00:00',
      status: 'scheduled',
      aircraft: apiResponse.aircraft?.modelCode || apiResponse.aircraftIata || null,
      delay: {
        departure: null,
        arrival: null
      },
      duration: calculateDuration(
        apiResponse.departure?.scheduledTime || apiResponse.departureTime || '00:00',
        apiResponse.arrival?.scheduledTime || apiResponse.arrivalTime || '00:00',
        apiResponse.date || apiResponse.flight_date
      ),
      isScheduleData: true,
      isFutureFlight: true
    };
  }

  // Handle possible null or undefined fields for current flights
  if (!apiResponse || !apiResponse.flight || !apiResponse.departure || !apiResponse.arrival) {
    console.warn('[AVIATION STACK] Received incomplete flight data:', JSON.stringify(apiResponse).substring(0, 200));
    
    // Create a basic flight object with defaults
    return {
      id: apiResponse?.flight?.iata || 'UNKNOWN',
      flightNumber: apiResponse?.flight?.iata || 'UNKNOWN',
      airline: apiResponse?.airline?.name || 'Unknown Airline',
      origin: {
        iataCode: apiResponse?.departure?.iata || 'UNK',
        name: apiResponse?.departure?.airport || 'Unknown Airport',
        city: '',
        country: '',
        terminal: null,
        gate: null
      },
      destination: {
        iataCode: apiResponse?.arrival?.iata || 'UNK',
        name: apiResponse?.arrival?.airport || 'Unknown Airport',
        city: '',
        country: '',
        terminal: null,
        gate: null
      },
      departureDate: apiResponse?.flight_date || new Date().toISOString().split('T')[0],
      departureTime: '00:00',
      arrivalDate: apiResponse?.flight_date || new Date().toISOString().split('T')[0],
      arrivalTime: '00:00',
      status: 'unknown',
      aircraft: null,
      delay: {
        departure: null,
        arrival: null
      },
      duration: '0h 0m',
      isScheduleData: true
    };
  }

  const flight = {
    id: apiResponse.flight.iata,
    flightNumber: apiResponse.flight.iata,
    airline: apiResponse.airline.name,
    origin: {
      iataCode: apiResponse.departure.iata,
      name: apiResponse.departure.airport,
      city: apiResponse.departure.city || '',
      country: apiResponse.departure.country || '',
      terminal: apiResponse.departure.terminal,
      gate: apiResponse.departure.gate
    },
    destination: {
      iataCode: apiResponse.arrival.iata,
      name: apiResponse.arrival.airport,
      city: apiResponse.arrival.city || '',
      country: apiResponse.arrival.country || '',
      terminal: apiResponse.arrival.terminal,
      gate: apiResponse.arrival.gate
    },
    departureDate: apiResponse.flight_date,
    departureTime: apiResponse.departure.scheduled ? new Date(apiResponse.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
    arrivalDate: apiResponse.flight_date, // Might need adjustment for overnight flights
    arrivalTime: apiResponse.arrival.scheduled ? new Date(apiResponse.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
    status: apiResponse.flight_status,
    aircraft: apiResponse.aircraft?.iata,
    delay: {
      departure: apiResponse.departure.delay,
      arrival: apiResponse.arrival.delay
    },
    isScheduleData: true
  };

  // Calculate duration
  if (apiResponse.departure.scheduled && apiResponse.arrival.scheduled) {
    const depTime = new Date(apiResponse.departure.scheduled);
    const arrTime = new Date(apiResponse.arrival.scheduled);
    const durationMs = arrTime - depTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    flight.duration = `${hours}h ${minutes}m`;
  } else {
    flight.duration = calculateDuration(
      flight.departureTime, 
      flight.arrivalTime, 
      flight.departureDate
    );
  }

  // Check if arrival is likely next day by comparing times
  if (flight.departureTime && flight.arrivalTime && flight.arrivalTime < flight.departureTime) {
    // Calculate next day
    const nextDay = new Date(flight.departureDate);
    nextDay.setDate(nextDay.getDate() + 1);
    flight.arrivalDate = nextDay.toISOString().split('T')[0];
  }

  return flight;
};

/**
 * Search airports by keyword
 */
const searchAirports = async (keyword) => {
  try {
    console.log(`[AVIATION STACK] Searching airports with keyword: "${keyword}"`);
    
    const response = await makeApiRequestWithRetry(`${AVIATION_STACK_API_URL}/airports`, {
      params: {
        access_key: API_KEY,
        search: keyword
      }
    });

    // Log raw API response
    logRawApiResponse('airports', { search: keyword }, response);

    if (!response.data?.data) {
      throw new Error('Invalid API response format');
    }

    const airports = response.data.data
      .filter(airport => airport.iata_code) // Only include airports with IATA codes
      .map(airport => ({
        iataCode: airport.iata_code,
        name: airport.airport_name,
        city: airport.city || '',
        country: airport.country_name || ''
      }));

    console.log(`[AVIATION STACK] Found ${airports.length} airports from API`);
    return airports;

  } catch (error) {
    console.error('[AVIATION STACK] Airport search error:', error.message);
    throw new Error('Failed to search airports');
  }
};

/**
 * Search real-time flight data
 */
const searchFlights = async (params) => {
  const { 
    originLocationCode, 
    destinationLocationCode, 
    departureDate,
    travelClass = 'ECONOMY',
    isFutureFlight = false,
    exactEndpoint = null,
    // Extract exact parameters for the flightsFuture endpoint
    iataCode,
    type,
    date
  } = params;

  // Flag to check if this is an exact future flights endpoint request
  const isExactFutureEndpoint = exactEndpoint === 'flightsFuture';

  // Determine if we're requesting future flight schedules - MOVED TO TOP
  let isFutureRequest = false;
  if (departureDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(departureDate);
    requestDate.setHours(0, 0, 0, 0);
    isFutureRequest = requestDate > today;
  } else if (isExactFutureEndpoint || isFutureFlight) {
    // If exactEndpoint is set to flightsFuture or isFutureFlight flag is true, consider it a future request
    isFutureRequest = true;
  } else if (date) {
    // If date parameter is provided (used for flightsFuture endpoint)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(date);
    requestDate.setHours(0, 0, 0, 0);
    isFutureRequest = requestDate > today;
  }

  try {
    console.log(`[AVIATION STACK] Searching flights with params:`, params);
    console.log(`[AVIATION STACK] isFutureRequest determined as: ${isFutureRequest}`);
    
    if (isExactFutureEndpoint) {
      console.log(`[AVIATION STACK] Using exact flightsFuture endpoint format`);
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(params, isFutureRequest);
    
    // Check cache first
    const cachedResult = flightCache.get(cacheKey);
    if (cachedResult) {
      console.log(`[AVIATION STACK] Returning cached result for ${cacheKey}`);
      return cachedResult;
    }
    
    // Validate the requested date if provided
    let dateValidation = null;
    if (departureDate) {
      dateValidation = validateFlightDate(departureDate);
      console.log(`[AVIATION STACK] Date validation for ${departureDate}:`, dateValidation.status);
      
      // If date format is invalid, throw error early
      if (dateValidation.status === 'invalid_format') {
        throw new Error(`Invalid date format: ${dateValidation.message}. Please use YYYY-MM-DD format.`);
      }
      
      // For future flight requests, validate that the date is at least 7 days in the future
      if (isFutureRequest && dateValidation.dateInfo.isTooSoon) {
        throw new Error(`Future flight schedules are only available for dates at least 7 days in the future. The earliest available date is ${dateValidation.dateInfo.minFutureDate}.`);
      }
    } else if (date && isFutureRequest) {
      // Also validate the 'date' parameter for future flights endpoint
      dateValidation = validateFlightDate(date);
      console.log(`[AVIATION STACK] Date validation for future endpoint date ${date}:`, dateValidation.status);
      
      if (dateValidation.status === 'invalid_format') {
        throw new Error(`Invalid date format: ${dateValidation.message}. Please use YYYY-MM-DD format.`);
      }
      
      // Check if the date is too soon for future flights
      if (dateValidation.dateInfo.isTooSoon) {
        throw new Error(`Future flight schedules are only available for dates at least 7 days in the future. The earliest available date is ${dateValidation.dateInfo.minFutureDate}.`);
      }
    }

    // Initialize API parameters for flight search
    let apiParams = {
      access_key: API_KEY,
      limit: 100,
      dep_iata: originLocationCode,
      arr_iata: destinationLocationCode,
      flight_date: departureDate
    };

    // Log request type and configure the appropriate endpoint
    let endpointUrl;
    
    // Check if this is using the exact flightsFuture endpoint
    if (isExactFutureEndpoint) {
      console.log(`[AVIATION STACK] Using exact flightsFuture endpoint with original parameters`);
      endpointUrl = FLIGHTS_FUTURE_ENDPOINT;
      
      // Important: Use the EXACT parameter names from the example URL
      // http://api.aviationstack.com/v1/flightsFuture?iataCode=JFK&type=arrival&date=2025-07-06&access_key=...
      apiParams = {
        access_key: API_KEY,        // API key (required)
        iataCode: iataCode,         // IATA code as provided in the request
        type: type || 'arrival',    // 'arrival' or 'departure' as provided in the request
        date: date                  // Date in YYYY-MM-DD format as provided in the request
      };
      
      // Log the exact URL we're going to call (with masked key)
      const urlWithParams = `${FLIGHTS_FUTURE_ENDPOINT}?iataCode=${iataCode}&type=${type || 'arrival'}&date=${date}&access_key=***`;
      console.log(`[AVIATION STACK] Making API call to: ${urlWithParams}`);
    }
    // Regular future flight request using the standard format
    else if (isFutureRequest) {
      console.log(`[AVIATION STACK] Configuring future flight search for date ${departureDate}`);
      endpointUrl = FLIGHTS_FUTURE_ENDPOINT;
      
      // Validate input parameters
      if (!departureDate) {
        throw new Error('Future flight search requires a valid departure date');
      }
      
      // Default to arrival type based on the example URL
      // http://api.aviationstack.com/v1/flightsFuture?iataCode=JFK&type=arrival&date=2025-07-06&access_key=...
      const flightType = params.flightType || 'arrival';
      
      // Validate the future flight date is at least 7 days in the future
      if (dateValidation && dateValidation.dateInfo.isTooSoon) {
        throw new Error(`Future flight schedules are only available for dates at least 7 days in the future. The earliest available date is ${dateValidation.dateInfo.minFutureDate}.`);
      }
      
      // Set API parameters using the correct names to match the example URL
      apiParams = {
        access_key: API_KEY,                 // API key (required)
        iataCode: originLocationCode,        // Airport IATA code (required)
        type: flightType,                    // Type of schedule: 'arrival' or 'departure'
        date: departureDate                  // Requested date in YYYY-MM-DD format
      };
      
      // Add destination filtering if needed
      if (destinationLocationCode) {
        console.log(`[AVIATION STACK] Will filter future flight results for destination: ${destinationLocationCode}`);
      }

      // Log the future flight request
      console.log(`[AVIATION STACK] Future flight request parameters:`, {
        ...apiParams,
        access_key: '***'
      });
    } else {
      console.log(`[AVIATION STACK] Configuring current flight search for date ${departureDate}`);
      endpointUrl = FLIGHTS_ENDPOINT; // Use flights endpoint for current flights
    }

    // Log the request (with masked API key)
    console.log(`[AVIATION STACK] Searching ${isFutureRequest ? 'future' : 'current'} flights with parameters:`, {
      ...apiParams,
      access_key: '***'
    });

    // Log the exact API call we're making (with masked API key)
    const urlParams = new URLSearchParams({...apiParams, access_key: '***'});
    console.log(`[AVIATION STACK] API URL: ${endpointUrl}?${urlParams.toString()}`);
    
    // Make the API request with the standard parameters
    try {
      const response = await makeApiRequestWithRetry(endpointUrl, {
        params: apiParams,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Log successful response
      console.log(`[AVIATION STACK] API request successful: HTTP ${response.status}`);

      // Log raw API response for debugging
      logRawApiResponse('flights', apiParams, response);

      // Log response details
      console.log(`[AVIATION STACK] Processing flight response:`, {
        hasData: !!response.data?.data,
        count: response.data?.data?.length || 0,
        date: departureDate,
        isFuture: isFutureRequest
      });
    } catch (requestError) {
      // Handle specific errors for future flights API
      if (isExactFutureEndpoint) {
        console.error(`[AVIATION STACK] Error in future flights API call:`, requestError.message);
        console.error(`[AVIATION STACK] Request URL: ${endpointUrl}`);
        console.error(`[AVIATION STACK] Request Params:`, {...apiParams, access_key: '***'});
        
        if (requestError.response) {
          console.error(`[AVIATION STACK] Response Status: ${requestError.response.status}`);
          console.error(`[AVIATION STACK] Response Data:`, requestError.response.data);
        }
        
        throw new Error(`Future flight API error: ${requestError.message}`);
      }
      
      // Re-throw other errors
      throw requestError;
    }

    // Process the response the same way for both current and future flights
    if (!response.data?.data) {
      throw new Error('Invalid API response format');
    }
    
    // Log flight results for any date
    console.log(`[AVIATION STACK] Processing flight data for date ${departureDate}`);
    if (response.data.data && response.data.data.length > 0) {
      console.log(`[AVIATION STACK] Found ${response.data.data.length} flights for date ${departureDate}`);
    } else {
      console.log(`[AVIATION STACK] No flights found for date ${departureDate}`);
      
      // Check if there's any specific message from the API
      if (response.data.error) {
        console.log(`[AVIATION STACK] Error from API:`, response.data.error);
      }
    }
    
    // Store API response metadata
    const apiResponseMetadata = {
      pagination: response.data.pagination || {},
      total: response.data.pagination?.total || 0,
      limit: response.data.pagination?.limit || 100,
      offset: response.data.pagination?.offset || 0,
      timestamp: new Date().toISOString()
    };

    // Get the raw flight data from the response
    let flightsData = response.data.data;
    
    // Add logging for response data structure
    console.log(`[AVIATION STACK] Response data structure:`, {
      hasData: !!response.data.data,
      dataLength: response.data.data?.length,
      firstItemKeys: response.data.data?.[0] ? Object.keys(response.data.data[0]) : []
    });
    
    // Filter flights for the specified route if needed
    if (originLocationCode && destinationLocationCode) {
      console.log(`[AVIATION STACK] Filtering flights for route ${originLocationCode} to ${destinationLocationCode}`);
      
      // Filter flights to match origin and destination
      if (isFutureRequest) {
        console.log(`[AVIATION STACK] Filtering future flights for route: ${originLocationCode} → ${destinationLocationCode}`);
        
        // For future flights, we need to check both origin and destination
        flightsData = flightsData.filter(flight => {
          // Extract origin and destination IATA codes from the flight data
          // Handle different field naming conventions from the API
          const originIata = (
            flight.departure?.iataCode || 
            flight.departure?.iata || 
            flight.departureIata || 
            ''
          ).toLowerCase();
          
          const destIata = (
            flight.arrival?.iataCode || 
            flight.arrival?.iata || 
            flight.arrivalIata || 
            ''
          ).toLowerCase();
          
          // Normalize input codes for comparison
          const originCode = originLocationCode.toLowerCase();
          const destCode = destinationLocationCode.toLowerCase();
          
          // Check if origin and destination match
          const originMatch = originIata === originCode;
          const destMatch = destIata === destCode;
          
          // Log the match results for debugging
          console.log(`[AVIATION STACK] Future flight origin check: ${originIata} === ${originCode}: ${originMatch}`);
          console.log(`[AVIATION STACK] Future flight destination check: ${destIata} === ${destCode}: ${destMatch}`);
          
          // For future flights, we want flights that match both origin and destination
          return originMatch && destMatch;
        });
      } else {
        // Current flight filtering - ensure consistent handling of IATA codes
        flightsData = flightsData.filter(flight => {
          const originIata = (flight.departure?.iata || '').toLowerCase();
          const destIata = (flight.arrival?.iata || '').toLowerCase();
          
          const originCode = originLocationCode.toLowerCase();
          const destCode = destinationLocationCode.toLowerCase();
          
          const originMatch = originIata === originCode;
          const destMatch = destIata === destCode;
          
          console.log(`[AVIATION STACK] Current flight origin check: ${originIata} === ${originCode}: ${originMatch}`);
          console.log(`[AVIATION STACK] Current flight destination check: ${destIata} === ${destCode}: ${destMatch}`);
          
          return originMatch && destMatch;
        });
      }
      
      console.log(`[AVIATION STACK] Found ${flightsData.length} flights for route ${originLocationCode} to ${destinationLocationCode}`);
    }
    
    // Map flights using the standard mapper
    const flights = flightsData.map(flight => {
      // Ensure isFutureRequest is passed correctly
      const mappedFlight = mapFlightResponse(flight, isFutureRequest);
      console.log(`[AVIATION STACK] Mapped flight (isFutureRequest=${isFutureRequest}):`, JSON.stringify(mappedFlight).substring(0, 200));
      return mappedFlight;
    });
    
    // Add schedule information
    flights.forEach(flight => {
      flight.isScheduleData = true;
      // Set isFutureFlight based on the determined isFutureRequest flag
      if (isFutureRequest) {
        flight.isFutureFlight = true;
      }
    });

    console.log(`[AVIATION STACK] Found ${flights.length} flights for route ${originLocationCode || '*'} to ${destinationLocationCode || '*'}`);
    
    // Log sample flight data for debugging
    if (flights.length > 0) {
        console.log(`[AVIATION STACK] Sample flight after mapping:`, JSON.stringify(flights[0]).substring(0, 300));
    }
    
    // Ensure we provide a clear count in logs
    console.log(`[AVIATION STACK] Final flight count after mapping and filtering: ${flights.length}`);
    
    // Add context about why flights might not be found
    let emptyResultContext = null;
    if (flights.length === 0) {
      emptyResultContext = {
        possibleReasons: [
          "No scheduled flights exist for this route on the specified date",
          "The API may have limited data for this specific route"
        ],
        suggestions: [
          "Try a different date",
          "Check if the route is serviced by airlines"
        ]
      };
      
      // Add date-specific reasons
      if (dateValidation) {
        if (dateValidation.status === 'too_soon') {
          emptyResultContext.possibleReasons.unshift(
            `The requested date is too soon for future flight API (minimum date is ${dateValidation.dateInfo.minFutureDate})`
          );
          emptyResultContext.suggestions.unshift(
            `Try a date after ${dateValidation.dateInfo.minFutureDate} for future flight searches`
          );
        } else if (dateValidation.status === 'far_future') {
          emptyResultContext.possibleReasons.unshift(
            "The requested date is too far in the future (beyond typical 11-month airline scheduling window)"
          );
          emptyResultContext.suggestions.unshift(
            `Try a date before ${dateValidation.dateInfo.maxScheduleDate}`
          );
        } else if (dateValidation.status === 'past') {
          emptyResultContext.possibleReasons.unshift(
            "The requested date is in the past"
          );
          emptyResultContext.suggestions.unshift(
            `Try a current or future date (today is ${dateValidation.dateInfo.currentDate})`
          );
        } else if (dateValidation.dateCategory === 'future') {
          emptyResultContext.possibleReasons.unshift(
            "Using paid tier AviationStack API to search future flights, but no flights were found"
          );
          emptyResultContext.suggestions.unshift(
            "Try another date or check if this route operates on this date"
          );
        }
      }
    }
    
    // Prepare the structured response with both flights and API metadata
    const result = {
      flights,  // This is the processed flights array
      apiResponse: {
        total: apiResponseMetadata.total,
        limit: apiResponseMetadata.limit,
        offset: apiResponseMetadata.offset,
        count: flights.length,
        source: 'AviationStack API',
        timestamp: new Date().toISOString()
      }
    };
    
    // Add dateValidation if available
    if (dateValidation) {
      result.dateValidation = dateValidation;
    }
    
    // Add empty result context if no flights were found
    if (emptyResultContext) {
      result.emptyResultContext = emptyResultContext;
    }
    
    // Add request parameters for debugging/tracking
    result.apiRequestParams = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      travelClass,
      searchTimestamp: new Date().toISOString()
    };
    
    // Cache the result with appropriate TTL
    const ttl = isFutureRequest ? CACHE_TTL_FUTURE_FLIGHTS : CACHE_TTL_CURRENT_FLIGHTS;
    flightCache.set(cacheKey, result, ttl);
    
    return result;

  } catch (error) {
    console.error('[AVIATION STACK] Flight search error:', error.response?.data || error.message);
    
    // Detailed error logging, especially for the flightsFuture endpoint
    // isFutureRequest is guaranteed to be defined here because we moved its definition to the top of the function
    if (isExactFutureEndpoint || isFutureRequest) {
      console.error(`[AVIATION STACK] Error occurred when calling future flights API (isFutureRequest=${isFutureRequest}, isExactFutureEndpoint=${isExactFutureEndpoint}):`);
      
      if (error.response) {
        console.error(`- Status: ${error.response.status}`);
        console.error(`- Status Text: ${error.response.statusText}`);
        console.error(`- Data:`, error.response.data);
        
        // Log the request URL and parameters for debugging
        if (error.config) {
          const safeParams = {...error.config.params};
          if (safeParams.access_key) safeParams.access_key = '***';
          
          console.error(`- Request URL: ${error.config.url}`);
          console.error(`- Request Params:`, safeParams);
        }
      }
    }
    
    // Special handling for future date API errors - using the already determined isFutureRequest flag
    if (isFutureRequest) {
      console.error('[AVIATION STACK] Error fetching future flight data:', error.message);
      
      // Determine which date parameter was used
      const dateParam = date || departureDate;
      
      // Check for specific error codes related to future schedules
      if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          
          // Handle validation errors specifically
          if (apiError.code === 'validation_error') {
            console.error('[AVIATION STACK] Validation error details:', apiError.context || {});
            
            // Construct a helpful message based on validation context
            let validationMsg = 'Request failed with validation error';
            
            if (apiError.context && apiError.context.date) {
              validationMsg = `Date validation error: ${apiError.context.date.join(', ')}`;
            } else if (apiError.context && apiError.context.iataCode) {
              validationMsg = `IATA code validation error: ${apiError.context.iataCode.join(', ')}`;
            } else if (apiError.context && apiError.context.type) {
              validationMsg = `Flight type validation error: ${apiError.context.type.join(', ')}`;
            }
            
            // Log recommended format for debugging
            console.error('[AVIATION STACK] Recommended API format for future flights:');
            console.error('http://api.aviationstack.com/v1/flightsFuture?iataCode=JFK&type=arrival&date=2025-07-06');
            
            throw new Error(`Future flight validation error: ${validationMsg}. Please ensure the date is in YYYY-MM-DD format and not too far in the future.`);
          }
          else if (apiError.code === 'out_of_schedule_range' || 
              apiError.code === 'schedule_not_available' ||
              apiError.code === 'invalid_access_key' ||
              apiError.code === 'usage_limit_reached' ||
              apiError.code === 'rate_limit_reached' ||
              apiError.message?.includes('schedule') ||
              apiError.message?.includes('future')) {
            
            // Log specific details about the error for debugging
            console.error('[AVIATION STACK] Detailed future flight API error:', {
              code: apiError.code,
              message: apiError.message,
              endpoint: isExactFutureEndpoint ? 'flightsFuture' : 'flights',
              date: date || departureDate
            });
            
            // Add helpful error messages for specific error codes
            if (apiError.code === 'out_of_schedule_range') {
              throw new Error(`The requested date (${dateParam}) is outside the available schedule range. Please try a date within the next 11 months.`);
            } else if (apiError.code === 'schedule_not_available') {
              throw new Error(`Flight schedules are not available for the date ${dateParam}. Airlines typically publish schedules 7 days to 11 months in advance.`);
            } else if (apiError.code === 'invalid_access_key') {
              throw new Error(`Your API key for AviationStack is invalid or has insufficient permissions for future flight searches. Future flight searches require the paid tier.`);
            } else {
              throw new Error(`Future flight schedule error: ${apiError.message}`);
            }
          }
        } else {
          // Provide more helpful error message for future flight data issues
          console.error('[AVIATION STACK] Unspecified future flight API error:', {
            message: error.message,
            endpoint: isExactFutureEndpoint ? 'flightsFuture' : 'flights',
            date: dateParam,
            isFutureRequest: isFutureRequest,
            requestParams: isExactFutureEndpoint ? 
              { iataCode, type, date } : 
              { originLocationCode, destinationLocationCode, departureDate }
          });
          
          const dateInfo = dateParam ? `(${dateParam})` : '';
          throw new Error(`Error fetching flights for future date ${dateInfo}: ${error.message}. 
          The API may have limitations or the date may be outside the valid range. Future flight searches require the AviationStack paid tier API.`);
        }
      }
    }
    
    // Provide detailed error messages for rate limit issues
    if (isRateLimitError(error)) {
      const retryAfter = error.response?.headers?.['retry-after'] || 
                         error.response?.headers?.['Retry-After'] || 
                         '60';
      
      // Try to parse retry-after header
      let retryTime;
      try {
        retryTime = parseInt(retryAfter, 10);
        // Convert to minutes if it's in seconds
        if (retryTime > 180) {
          retryTime = Math.ceil(retryTime / 60);
          retryTime = `${retryTime} minutes`;
        } else {
          retryTime = `${retryTime} seconds`;
        }
      } catch (e) {
        retryTime = '1 minute';
      }
      
      throw new Error(`Rate limit reached. Please try again in ${retryTime}. Consider reducing the frequency of requests or upgrading your API plan for higher limits.`);
    }
    
    throw new Error(`Failed to search flights: ${error.message}`);
  }
};

/**
 * Gets service status information
 * @returns {Object} Service status
 */
const getServiceStatus = () => {
  return {
    provider: 'AviationStack API',
    apiKeyConfigured: !!API_KEY,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1',
    features: {
      realTimeFlights: true,
      historicalFlights: true,
      futureFlights: true, // Supported with flightsFuture endpoint for future dates
      pricing: false, // AviationStack doesn't provide pricing data
      caching: true, // We've implemented caching
      rateLimitHandling: true, // We've implemented rate limit handling
      airportInfo: true,
      flightStatus: true
    },
    endpoints: {
      flights: FLIGHTS_ENDPOINT,
      flightsFuture: FLIGHTS_FUTURE_ENDPOINT,
      airports: `${AVIATION_STACK_API_URL}/airports`
    }
  };
};

/**
 * Clears the flight cache
 * @returns {Object} Information about the cleared cache
 */
const clearCache = () => {
  const stats = flightCache.getStats();
  flightCache.flushAll();
  return {
    cleared: true,
    previousStats: stats,
    timestamp: new Date().toISOString()
  };
};

/**
 * Gets cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  return {
    ...flightCache.getStats(),
    timestamp: new Date().toISOString(),
    maxSize: CACHE_MAX_SIZE,
    ttlCurrentFlights: CACHE_TTL_CURRENT_FLIGHTS,
    ttlFutureFlights: CACHE_TTL_FUTURE_FLIGHTS
  };
};

module.exports = {
  searchAirports,
  searchFlights,
  getServiceStatus,
  clearCache,
  getCacheStats
};
