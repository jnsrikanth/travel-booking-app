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

// Configuration
const AVIATION_STACK_API_URL = 'http://api.aviationstack.com/v1';
const FLIGHTS_ENDPOINT = `${AVIATION_STACK_API_URL}/flights`;
const FLIGHTS_FUTURE_ENDPOINT = `${AVIATION_STACK_API_URL}/flightsFuture`;
const API_KEY = process.env.AVIATION_STACK_API_KEY;

if (!API_KEY) {
  throw new Error('AviationStack API key is required. Set AVIATION_STACK_API_KEY in environment variables.');
}

/**
 * Calculate flight duration
 */
const calculateDuration = (departure, arrival) => {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  const diff = arr - dep;
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
  
  const isPast = requestedDate < today;
  const isFarFuture = requestedDate > maxFutureDate;
  const isNearTerm = requestedDate <= nearTermDate;
  
  let status = 'valid';
  let message = 'Date is within valid range';
  let dateCategory = 'current';
  
  if (isPast) {
    status = 'past';
    message = 'The requested date is in the past.';
    dateCategory = 'historical';
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
      isPast,
      isFarFuture,
      isNearTerm
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
      // For flightsFuture endpoint, log more detailed information
      if (endpoint === 'flightsFuture') {
        console.log(`[AVIATION STACK] flightsFuture sample data structure:`);
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
 * Search airports by keyword
 */
const searchAirports = async (keyword) => {
  try {
    console.log(`[AVIATION STACK] Searching airports with keyword: "${keyword}"`);
    
    const response = await axios.get(`${AVIATION_STACK_API_URL}/airports`, {
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
    departureDate
  } = params;

  try {
    console.log(`[AVIATION STACK] Searching flights with params:`, params);
    
    // Validate the requested date if provided
    let dateValidation = null;
    if (departureDate) {
      dateValidation = validateFlightDate(departureDate);
      console.log(`[AVIATION STACK] Date validation for ${departureDate}:`, dateValidation.status);
    }
    
    // Determine if we're requesting future flight schedules
    let isFutureRequest = false;
    if (departureDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestDate = new Date(departureDate);
      requestDate.setHours(0, 0, 0, 0);
      isFutureRequest = requestDate > today;
    }

    // Initialize API parameters - these will be different based on the endpoint
    let apiParams = {
      access_key: API_KEY,
      limit: 100
    };

    // Select appropriate endpoint and parameters based on whether this is a future request
    let endpointUrl;
    
    if (isFutureRequest) {
      console.log(`[AVIATION STACK] Requesting future flights for ${departureDate}`);
      endpointUrl = FLIGHTS_FUTURE_ENDPOINT;
      
      // Set parameters for flightsFuture endpoint
      if (originLocationCode) {
        // For future flights, we need to specify if this is departure or arrival
        apiParams.iataCode = originLocationCode;
        apiParams.type = 'departure';  // We're searching from origin
      }
      
      if (departureDate) {
        apiParams.date = departureDate;
      }
      
      // Note: For flightsFuture, we'll filter for destination in memory after getting results
      console.log(`[AVIATION STACK] Using flightsFuture endpoint with parameters:`, apiParams);
    } else {
      // For current/past flights, use the regular flights endpoint
      endpointUrl = FLIGHTS_ENDPOINT;
      
      // Set parameters for flights endpoint
      if (originLocationCode) {
        apiParams.dep_iata = originLocationCode;
      }
      
      if (destinationLocationCode) {
        apiParams.arr_iata = destinationLocationCode;
      }
      
      if (departureDate) {
        apiParams.flight_date = departureDate;
      }
      
      console.log(`[AVIATION STACK] Using flights endpoint with parameters:`, apiParams);
    }

    // Prepare API request options
    const requestOptions = {
      params: apiParams,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Initialize response variable
    let response;
    
    // Make the API request to the appropriate endpoint
    console.log(`[AVIATION STACK] Calling endpoint: ${endpointUrl}`);
    response = await axios.get(endpointUrl, requestOptions);

    // Log raw API response for debugging
    logRawApiResponse(isFutureRequest ? 'flightsFuture' : 'flights', apiParams, response);

    if (!response.data?.data) {
      throw new Error('Invalid API response format');
    }
    
    // For debugging future date responses
    if (isFutureRequest) {
      console.log(`[AVIATION STACK] Future flight response received for ${departureDate}`);
      // Log the first few items to help with debugging
      if (response.data.data && response.data.data.length > 0) {
        console.log(`[AVIATION STACK] Found ${response.data.data.length} future flights`);
        console.log(`[AVIATION STACK] Sample future flight:`, JSON.stringify(response.data.data[0]).substring(0, 200));
        
        // Log more details about flight structure (schema may differ for flightsFuture)
        console.log(`[AVIATION STACK] Flight response structure example (first item):`);
        const firstItem = response.data.data[0];
        
        // Handle potentially different response structure for flightsFuture endpoint
        if (firstItem.flight_date) {
          console.log(`  - Flight Date: ${firstItem.flight_date || 'N/A'}`);
        }
        
        if (firstItem.flight) {
          console.log(`  - Flight: ${firstItem.flight.iata || 'N/A'}`);
        } else if (firstItem.flight_iata) {
          console.log(`  - Flight: ${firstItem.flight_iata || 'N/A'}`);
        }
        
        if (firstItem.departure) {
          console.log(`  - Departure: ${firstItem.departure.scheduled || firstItem.departure.estimated || 'N/A'}`);
        } else if (firstItem.departure_scheduled) {
          console.log(`  - Departure: ${firstItem.departure_scheduled || 'N/A'}`);
        }
        
        if (firstItem.arrival) {
          console.log(`  - Arrival: ${firstItem.arrival.scheduled || firstItem.arrival.estimated || 'N/A'}`);
        } else if (firstItem.arrival_scheduled) {
          console.log(`  - Arrival: ${firstItem.arrival_scheduled || 'N/A'}`);
        }
      } else {
        console.log(`[AVIATION STACK] No future flights found in API response`);
        
        // Check if there's any specific message about future flight data
        if (response.data.error) {
          console.log(`[AVIATION STACK] Error from API for future flights:`, response.data.error);
        }
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
    
    // Handle different response formats between endpoints
    if (isFutureRequest) {
      console.log(`[AVIATION STACK] Processing flightsFuture response data format`);
      
      // If we're searching for a specific destination, filter the future flights
      if (destinationLocationCode) {
        console.log(`[AVIATION STACK] Filtering future flights for destination: ${destinationLocationCode}`);
        flightsData = flightsData.filter(flight => {
          // The structure for flightsFuture endpoint has arrival.iataCode
          const arrivalIata = flight.arrival?.iataCode || flight.arrival?.iata || flight.destination_iata || flight.arr_iata;
          
          // Check for match using case-insensitive comparison
          const isMatch = arrivalIata && arrivalIata.toLowerCase() === destinationLocationCode.toLowerCase();
          console.log(`[AVIATION STACK] Flight filter check: ${arrivalIata} === ${destinationLocationCode}: ${isMatch}`);
          return isMatch;
        });
      }
    } else {
      // For regular flights endpoint, filter as before
      if (originLocationCode && destinationLocationCode) {
        console.log(`[AVIATION STACK] Filtering flights for route ${originLocationCode} to ${destinationLocationCode}`);
        flightsData = flightsData.filter(flight => 
          flight.departure?.iata?.toLowerCase() === originLocationCode.toLowerCase() &&
          flight.arrival?.iata?.toLowerCase() === destinationLocationCode.toLowerCase()
        );
      }
    }
    
    // The response structure might be different between flights and flightsFuture endpoints
    // So we need to normalize the data to our standard format
    const flights = flightsData.map(flight => {
      // Create a normalized flight object that works with both endpoints
      let flightObj;
      
      if (isFutureRequest) {
        // Handle flightsFuture endpoint response format
        // The structure is different from the regular flights endpoint
        console.log(`[AVIATION STACK] Mapping flightsFuture data: ${JSON.stringify(flight).substring(0, 200)}...`);
        
        // Extract airline and flight information
        // For flightsFuture, we might have airline.name directly 
        const airlineName = flight.airline?.name || flight.airline_name || 'Unknown Airline';
        
        // Generate a flight number if not available
        const airlineCode = flight.airline?.iataCode || flight.airline?.iata || 'UNK';
        const flightNumber = flight.flight?.number || flight.flight_number || '000';
        const flightIata = `${airlineCode}${flightNumber}`;
        
        // Extract departure information - flightsFuture uses iataCode instead of iata
        const depIata = flight.departure?.iataCode || flight.departure?.iata || flight.departure_iata || flight.dep_iata || originLocationCode;
        const depAirport = flight.departure?.airport || flight.departure_airport || 'Unknown Airport';
        const depCity = flight.departure?.city || flight.departure_city || '';
        const depCountry = flight.departure?.country || flight.departure_country || '';
        const depTerminal = flight.departure?.terminal || flight.departure_terminal || null;
        const depGate = flight.departure?.gate || flight.departure_gate || null;
        
        // Extract arrival information - flightsFuture uses iataCode instead of iata
        const arrIata = flight.arrival?.iataCode || flight.arrival?.iata || flight.arrival_iata || flight.arr_iata || destinationLocationCode;
        const arrAirport = flight.arrival?.airport || flight.arrival_airport || 'Unknown Airport';
        const arrCity = flight.arrival?.city || flight.arrival_city || '';
        const arrCountry = flight.arrival?.country || flight.arrival_country || '';
        const arrTerminal = flight.arrival?.terminal || flight.arrival_terminal || null;
        const arrGate = flight.arrival?.gate || flight.arrival_gate || null;
        
        // Extract scheduled timestamps for future flights
        const depScheduled = flight.departure?.scheduled || flight.departure_scheduled || new Date().toISOString();
        const arrScheduled = flight.arrival?.scheduled || flight.arrival_scheduled || new Date().toISOString();
        const flightDate = flight.flight_date || departureDate || new Date(depScheduled).toISOString().split('T')[0];
        
        flightObj = {
          id: flightIata,
          airline: airlineName,
          flightNumber: flightIata,
          origin: {
            iataCode: depIata,
            name: depAirport,
            city: depCity,
            country: depCountry,
            terminal: depTerminal,
            gate: depGate
          },
          destination: {
            iataCode: arrIata,
            name: arrAirport,
            city: arrCity,
            country: arrCountry,
            terminal: arrTerminal,
            gate: arrGate
          },
          departureDate: flightDate,
          departureTime: new Date(depScheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          arrivalDate: new Date(arrScheduled).toISOString().split('T')[0],
          arrivalTime: new Date(arrScheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          duration: calculateDuration(depScheduled, arrScheduled),
          status: flight.flight_status || flight.status || 'scheduled',
          aircraft: flight.aircraft?.modelCode || flight.aircraft?.iata || flight.aircraft_iata || null,
          delay: {
            departure: flight.departure?.delay || null,
            arrival: flight.arrival?.delay || null
          },
          isScheduleData: true,
          weekday: flight.weekday || null
        };
      } else {
        // Handle regular flights endpoint response format
        flightObj = {
          id: flight.flight?.iata || `${flight.airline?.iata || 'UNK'}${flight.flight?.number || '000'}`,
          airline: flight.airline?.name || 'Unknown Airline',
          flightNumber: flight.flight?.iata || `${flight.airline?.iata || 'UNK'}${flight.flight?.number || '000'}`,
          origin: {
            iataCode: flight.departure.iata,
            name: flight.departure.airport,
            city: flight.departure.city || '',
            country: flight.departure.country || '',
            terminal: flight.departure.terminal,
            gate: flight.departure.gate
          },
          destination: {
            iataCode: flight.arrival.iata,
            name: flight.arrival.airport,
            city: flight.arrival.city || '',
            country: flight.arrival.country || '',
            terminal: flight.arrival.terminal,
            gate: flight.arrival.gate
          },
          departureDate: flight.flight_date,
          departureTime: new Date(flight.departure.scheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          arrivalDate: new Date(flight.arrival.scheduled).toISOString().split('T')[0],
          arrivalTime: new Date(flight.arrival.scheduled).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          duration: calculateDuration(
            flight.departure.scheduled,
            flight.arrival.scheduled
          ),
          status: flight.flight_status,
          aircraft: flight.aircraft?.iata,
          delay: {
            departure: flight.departure?.delay || null,
            arrival: flight.arrival?.delay || null
          },
          isScheduleData: false
        };
      }
      
      return flightObj;
    });

    console.log(`[AVIATION STACK] Found ${flights.length} flights for route ${originLocationCode || '*'} to ${destinationLocationCode || '*'}`);
    
    // Log sample flight data for debugging
    if (flights.length > 0) {
        console.log(`[AVIATION STACK] Sample flight after mapping:`, JSON.stringify(flights[0]).substring(0, 300));
    }
    
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
        if (dateValidation.status === 'far_future') {
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
            "Airline schedules may not be fully published for this date yet"
          );
          emptyResultContext.suggestions.unshift(
            `Try a date within the next 7 days (before ${dateValidation.dateInfo.nearTermDate})`
          );
        }
      }
    }
    
    // Return a structured response with both flights and API metadata
    return {
      flights: flights,
      apiResponse: apiResponseMetadata,
      apiRequestParams: {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        searchTimestamp: new Date().toISOString()
      },
      dateValidation: dateValidation,
      emptyResultContext: emptyResultContext
    };

  } catch (error) {
    console.error('[AVIATION STACK] Flight search error:', error.response?.data || error.message);
    
    // Special handling for future date API errors
    if (departureDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestDate = new Date(departureDate);
      requestDate.setHours(0, 0, 0, 0);
      
      if (requestDate > today) {
        console.error('[AVIATION STACK] Error fetching future flight data:', error.message);
        
        // Check for specific error codes related to future schedules
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          
          if (apiError.code === 'out_of_schedule_range' || 
              apiError.code === 'schedule_not_available' ||
              apiError.code === 'invalid_access_key' ||
              apiError.code === 'usage_limit_reached' ||
              apiError.message?.includes('schedule') ||
              apiError.message?.includes('future')) {
            
            // Log specific details about the error for debugging
            console.error('[AVIATION STACK] Detailed future flight API error:', {
              code: apiError.code,
              message: apiError.message,
              endpoint: 'flightsFuture',
              date: departureDate
            });
            
            throw new Error(`Future flight schedule error: ${apiError.message}`);
          }
        } else {
          // Provide more helpful error message for future flight data issues
          console.error('[AVIATION STACK] Unspecified future flight API error:', {
            message: error.message,
            endpoint: 'flightsFuture',
            date: departureDate
          });
          
          throw new Error(`Error fetching flights for future date (${departureDate}): ${error.message}. 
          This may be due to future flight data limitations in the current API tier or the date being too far in the future.`);
        }
      }
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
      futureFlights: true, // Now supported with flightsFuture endpoint
      pricing: false, // AviationStack doesn't provide pricing data
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

module.exports = {
  searchAirports,
  searchFlights,
  getServiceStatus
};
