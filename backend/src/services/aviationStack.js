/**
 * AviationStack API Service
 * 
 * Provides integration with the AviationStack API for searching flights and airports.
 * Includes validation, error handling, and data transformation.
 */

const axios = require('axios');
const RedisCache = require('./redisCache');
const logger = require('../utils/logger');
const apiResilience = require('./apiResilience');

// Base configuration for AviationStack API
const API_BASE_URL = process.env.AVIATION_STACK_API_URL || 'https://api.aviationstack.com/v1';
const API_KEY = process.env.AVIATION_STACK_API_KEY;

if (!API_KEY) {
  throw new Error('AVIATION_STACK_API_KEY environment variable is required');
}

// Rate limiting configuration
const RATE_LIMIT = {
  REQUESTS_PER_SECOND: 2,
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_MONTH: 10000,
  RETRY_AFTER: 5000, // 5 seconds default retry delay
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2 // Exponential backoff multiplier
};

// Cache configuration
const CACHE_CONFIG = {
  AIRPORT_TTL: 24 * 60 * 60 * 1000, // 24 hours for airports
  FLIGHT_TTL: 5 * 60 * 1000,        // 5 minutes for flights
  MAX_ENTRIES: 1000                  // Maximum cache entries
};

/**
 * AviationStack API Configuration
 * Tier: Paid (10,000 Requests/month)
 * Features:
 * - Standard Support
 * - Commercial License
 * - Full Aviation Data
 * - Real-Time Flights
 * - Historical Flights
 * - HTTPS Encryption
 * - Airline Routes
 * - Autocomplete
 * - Flight Schedules
 * - Future Flight
 */

class AviationStackService {
  constructor() {
    console.log('[AVIATION STACK] Initializing AviationStack service');
    this.accessKey = process.env.AVIATION_STACK_API_KEY;
    if (!this.accessKey) {
      console.error('[AVIATION STACK] API key is not configured');
      throw new Error('AviationStack API key is not configured');
    }
    console.log('[AVIATION STACK] API key configured');
    
    // Initialize base URL
    this.baseUrl = 'http://api.aviationstack.com/v1';
    
    // Initialize HTTP client
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('[AVIATION STACK] HTTP client initialized');
    
    // Initialize Redis client - simplified implementation
    try {
      const Redis = require('ioredis');
      this.redisClient = new Redis({
        host: 'localhost',
        port: 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      
      this.redisClient.on('connect', () => {
        console.log('[INFO] [REDIS] Connected to Redis server');
      });
      
      this.redisClient.on('error', (err) => {
        console.error('[ERROR] [REDIS] Redis connection error:', err.message);
        // Fallback to no caching if Redis fails
        this.redisClient = null;
      });
      
    } catch (error) {
      console.warn('[WARN] [REDIS] Redis not available, proceeding without caching:', error.message);
      this.redisClient = null;
    }
    
    // Rate limiting configuration
    this.rateLimit = {
      maxRetries: 3,
      retryDelay: 10000 // 10 seconds base delay
    };
    console.log('[AVIATION STACK] Rate limiting configured');
  }

  async resetRateLimits() {
    const now = Date.now();
    if (now - this.lastRequestTime >= 1000) {
      this.requestsThisSecond = 0;
    }
    if (now - this.lastRequestTime >= 60000) {
      this.requestsThisMinute = 0;
    }
    this.lastRequestTime = now;
  }

  async checkRateLimit() {
    await this.resetRateLimits();
    
    if (this.requestsThisSecond >= RATE_LIMIT.REQUESTS_PER_SECOND) {
      throw new Error('Rate limit exceeded (per second). Please try again in a few seconds.');
    }
    
    if (this.requestsThisMinute >= RATE_LIMIT.REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded (per minute). Please try again in a minute.');
    }
  }

  async makeRequest(endpoint, params) {
    try {
      await this.checkRateLimit();

      const response = await this.client.get(endpoint, {
        params: {
          access_key: this.accessKey,
          ...params
        }
      });

      if (response.data?.error) {
        const error = response.data.error;
        if (error.code === 104 || error.message.includes('monthly limit')) {
          throw new Error('Monthly API request limit reached. Please try again next month.');
        } else if (error.code === 103 || error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        } else {
          throw new Error(error.message || 'Unexpected API error');
        }
      }

      this.requestsThisSecond++;
      this.requestsThisMinute++;
      this.retryCount = 0;

      return response.data;
      
    } catch (error) {
      if (error.response?.status === 429 || error.message.includes('Rate limit exceeded')) {
        if (this.retryCount < RATE_LIMIT.MAX_RETRIES) {
          this.retryCount++;
          const delay = RATE_LIMIT.RETRY_AFTER * Math.pow(RATE_LIMIT.BACKOFF_MULTIPLIER, this.retryCount);
          console.log(`[AVIATION STACK] Rate limited. Retry ${this.retryCount}/${RATE_LIMIT.MAX_RETRIES} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, params);
        }
      }

      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        throw new Error(`API Error: ${apiError.message || apiError.code || 'Unknown error'}`);
      }

      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  }

  async searchAirports(keyword) {
    try {
      // Check cache only if Redis client is available
      if (this.redisClient) {
        try {
          const cachedAirports = await this.redisClient.get(`airports:${keyword}`);
          if (cachedAirports) {
            console.log(`[AVIATION STACK] Found cached airports for: ${keyword}`);
            return JSON.parse(cachedAirports);
          }
        } catch (cacheError) {
          console.warn('[AVIATION STACK] Cache read error:', cacheError.message);
        }
      }

      console.log(`[AVIATION STACK] Searching airports for keyword: ${keyword}`);
      const response = await axios.get(`${this.baseUrl}/airports`, {
        params: { access_key: this.accessKey, search: keyword },
      });

      const airports = response.data.data || [];
      const sortedAirports = airports.sort((a, b) => a.airport_name.localeCompare(b.airport_name));

      // Cache result only if Redis client is available
      if (this.redisClient) {
        try {
          await this.redisClient.set(`airports:${keyword}`, JSON.stringify(sortedAirports), 'EX', 3600);
          console.log(`[AVIATION STACK] Cached ${sortedAirports.length} airports for: ${keyword}`);
        } catch (cacheError) {
          console.warn('[AVIATION STACK] Cache write error:', cacheError.message);
        }
      }
      
      return sortedAirports; // Return the raw array directly
    } catch (error) {
      console.error(`[AVIATION STACK] Error searching airports:`, error.message);
      throw new Error(`API Error: ${error.message}`);
    }
  }

  async searchFlights(params) {
    const { originLocationCode, destinationLocationCode, departureDate, adults, travelClass } = params;

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      throw new Error('Missing required parameters: originLocationCode, destinationLocationCode, or departureDate');
    }

    // Validate airport codes (3-letter IATA format)
    if (!/^[A-Z]{3}$/.test(originLocationCode) || !/^[A-Z]{3}$/.test(destinationLocationCode)) {
      throw new Error('Invalid airport code. Must be a 3-letter IATA code (e.g., JFK, LAX)');
    }

    // Parse and validate departure date
    const departureDateObj = new Date(departureDate);
    if (isNaN(departureDateObj.getTime())) {
      throw new Error('Invalid departure date format. Use YYYY-MM-DD');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparison
    departureDateObj.setHours(0, 0, 0, 0); // Also normalize departure date for accurate comparison

    // Check if the search is for future flights
    const isFutureSearch = departureDateObj > today;
    
    console.log(`[AVIATION STACK] Date comparison: departureDate=${departureDateObj.toISOString()}, today=${today.toISOString()}, isFutureSearch=${isFutureSearch}`);

    // Generate a unique cache key for the search
    const cacheKey = `flightSearch:${originLocationCode}:${destinationLocationCode}:${departureDate}:${adults || 1}:${travelClass || 'ECONOMY'}`;

    // Check cache for existing results (only if Redis is available)
    if (this.redisClient) {
      try {
        const cachedResults = await this.redisClient.get(cacheKey);
        if (cachedResults) {
          console.log(`[AVIATION STACK] Found cached flight results for: ${cacheKey}`);
          return JSON.parse(cachedResults);
        }
      } catch (cacheError) {
        console.warn('[AVIATION STACK] Cache read error:', cacheError.message);
      }
    }

    try {
      let result;
      
      if (isFutureSearch) {
        // Use the new searchFutureFlights method for future dates
        console.log('[AVIATION STACK] Using future flights API for date:', departureDate);
        result = await this.searchFutureFlights({
          originLocationCode,
          destinationLocationCode,
          departureDate,
          adults,
          travelClass
        });
        
        // Cache the results for 1 hour (3600 seconds) if Redis is available
        if (this.redisClient) {
          try {
            await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
            console.log(`[AVIATION STACK] Cached future flight results for: ${cacheKey}`);
          } catch (cacheError) {
            console.warn('[AVIATION STACK] Cache write error:', cacheError.message);
          }
        }
        
        return result;
      } else {
        // Use regular flights API for current/past dates
        const endpoint = '/flights';
        const queryParams = {
          dep_iata: originLocationCode,
          arr_iata: destinationLocationCode,
          flight_date: departureDate,
          limit: 100,
        };
        
        console.log(`[AVIATION STACK] Calling ${endpoint} with params:`, queryParams);

        if (adults) queryParams.adults = adults;
        if (travelClass) queryParams.travelClass = travelClass;

        const response = await this.makeRequest(endpoint, queryParams);
        console.log(`[AVIATION STACK] Raw API response for ${endpoint}:`, JSON.stringify(response, null, 2));
        
        // AviationStack API response structure: { pagination: {...}, data: [...] }
        let flightData = [];
        if (response && response.data && Array.isArray(response.data)) {
          flightData = response.data;
        } else if (response && Array.isArray(response)) {
          flightData = response;
        } else {
          console.warn(`[AVIATION STACK] Unexpected response structure for ${endpoint}:`, response);
          flightData = [];
        }
        
        console.log(`[AVIATION STACK] Extracted ${flightData.length} flights from API response`);

        // Transform flight data to our expected format
        const transformedFlights = flightData.map(flight => this.transformFlightData(
          flight, 
          travelClass, 
          originLocationCode, 
          destinationLocationCode
        )).filter(flight => flight !== null);
        
        console.log(`[AVIATION STACK] Transformed ${transformedFlights.length} flights successfully`);
        
        // Cache the results for 1 hour (3600 seconds) if Redis is available
        if (this.redisClient) {
          try {
            await this.redisClient.set(cacheKey, JSON.stringify(transformedFlights), 'EX', 3600);
            console.log(`[AVIATION STACK] Cached flight results for: ${cacheKey}`);
          } catch (cacheError) {
            console.warn('[AVIATION STACK] Cache write error:', cacheError.message);
          }
        }
        
        return transformedFlights;
      }
    } catch (error) {
      console.error('[API] Error searching flights:', error.message);
      throw new Error('Failed to fetch flight data');
    }
  }

  transformFlightData(flight, travelClass, expectedOrigin, expectedDestination) {
    try {
      if (!flight || !flight.departure || !flight.arrival) {
        return null;
      }

      // Validate flight direction matches search parameters
      if (expectedOrigin && flight.departure.iata !== expectedOrigin) {
        return null;
      }
      if (expectedDestination && flight.arrival.iata !== expectedDestination) {
        return null;
      }

      const origin = {
        iataCode: flight.departure.iata,
        name: flight.departure.airport,
        city: flight.departure.city,
        country: flight.departure.country,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate
      };

      const destination = {
        iataCode: flight.arrival.iata,
        name: flight.arrival.airport,
        city: flight.arrival.city,
        country: flight.arrival.country,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate
      };

      if (!origin.iataCode || !destination.iataCode) {
        return null;
      }

      const departureISO = flight.departure.scheduled || flight.flight_date;
      const arrivalISO = flight.arrival.scheduled || flight.flight_date;
      
      const duration = this.calculateDuration(departureISO, arrivalISO);
      const price = this.calculatePrice(travelClass, duration);

      return {
        id: `${flight.airline.iata}${flight.flight.number}`,
        airline: flight.airline.name,
        flightNumber: `${flight.airline.iata}${flight.flight.number}`,
        origin,
        destination,
        departureDate: new Date(departureISO).toISOString().split('T')[0],
        departureTime: new Date(departureISO).toISOString().split('T')[1].substring(0, 5),
        arrivalDate: new Date(arrivalISO).toISOString().split('T')[0],
        arrivalTime: new Date(arrivalISO).toISOString().split('T')[1].substring(0, 5),
        duration,
        price,
        class: travelClass,
        status: flight.flight_status || 'scheduled',
        isRealData: true
      };
    } catch (error) {
      console.error('Error transforming flight data:', error);
      return null;
    }
  }

  calculatePrice(travelClass, duration) {
    let basePrice = 200;
    switch (travelClass?.toUpperCase()) {
      case 'BUSINESS': basePrice *= 2.5; break;
      case 'FIRST': basePrice *= 4; break;
    }
    const durationHours = parseInt(duration.split('h')[0]) || 2;
    basePrice += durationHours * 50;
    return Math.round(basePrice);
  }

  calculateDuration(departureTime, arrivalTime) {
    try {
      const durationMs = new Date(arrivalTime) - new Date(departureTime);
      const hours = Math.floor(durationMs / 3600000);
      const minutes = Math.floor((durationMs % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return '0h 0m';
    }
  }

  async searchFutureFlights(params) {
    const axios = require('axios');
    const apiKey = this.accessKey;
    const baseUrl = 'https://api.aviationstack.com/v1';
    
    console.log('[AVIATION STACK] Searching future flights with params:', params);
    
    // Create a more specific cache key for future flights
    const futureFlightsCacheKey = `future_flights:${params.originLocationCode}:${params.destinationLocationCode}:${params.departureDate}:${params.travelClass || 'ECONOMY'}`;
    
    // Check cache first - cache future flights for 4 hours since they don't change frequently
    if (this.redisClient) {
      try {
        const cachedResult = await this.redisClient.get(futureFlightsCacheKey);
        if (cachedResult) {
          console.log('[AVIATION STACK] Returning cached future flights');
          return JSON.parse(cachedResult);
        }
      } catch (cacheError) {
        console.warn('[AVIATION STACK] Cache read error:', cacheError.message);
      }
    }
    
    // Check if we've made a recent futureFlights API call (1 per minute limit)
    const now = Date.now();
    const lastFutureFlightCall = this.lastFutureFlightCall || 0;
    const timeSinceLastCall = now - lastFutureFlightCall;
    const minInterval = 60000; // 1 minute in milliseconds
    
    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      console.log(`[AVIATION STACK] Future flights rate limit: waiting ${Math.ceil(waitTime/1000)} seconds before API call`);
      
      // Instead of waiting, return synthetic flights immediately
      console.log('[AVIATION STACK] Returning synthetic future flights to avoid rate limit wait');
      const syntheticResult = this.generateSyntheticFutureFlights(params);
      
      // Cache synthetic results for 30 minutes to reduce repeated synthetic generation
      if (this.redisClient) {
        try {
          await this.redisClient.set(futureFlightsCacheKey, JSON.stringify(syntheticResult), 'EX', 1800); // 30 minutes
          console.log('[AVIATION STACK] Cached synthetic future flights for 30 minutes');
        } catch (cacheError) {
          console.warn('[AVIATION STACK] Cache write error:', cacheError.message);
        }
      }
      
      return syntheticResult;
    }
    
    try {
      // Record the API call time
      this.lastFutureFlightCall = now;
      
      // For future flights, we need to make separate API calls for departures and arrivals
      // First, get departures from origin airport
      const departureParams = {
        access_key: apiKey,
        iataCode: params.originLocationCode,
        type: 'departure',
        date: params.departureDate
      };
      
      console.log('[AVIATION STACK] Calling flightsFuture API for departures:', departureParams);
      const departureResponse = await axios.get(`${baseUrl}/flightsFuture`, { 
        params: departureParams,
        timeout: 20000 // 20 second timeout
      });
      
      let departureFlights = [];
      if (departureResponse.data && departureResponse.data.data) {
        departureFlights = departureResponse.data.data;
      }
      
      console.log(`[AVIATION STACK] Found ${departureFlights.length} departure flights from ${params.originLocationCode}`);
      
      // Filter flights that go to the destination airport
      const relevantFlights = departureFlights.filter(flight => {
        return flight.arrival && flight.arrival.iata === params.destinationLocationCode;
      });
      
      console.log(`[AVIATION STACK] Found ${relevantFlights.length} relevant flights to ${params.destinationLocationCode}`);
      
      // Transform the flights to our expected format
      const transformedFlights = relevantFlights.map(flight => {
        return this.transformFlightData(flight, params.travelClass, params.originLocationCode, params.destinationLocationCode);
      }).filter(flight => flight !== null);
      
      console.log(`[AVIATION STACK] Transformed ${transformedFlights.length} future flights`);
      
      return {
        flights: transformedFlights,
        apiResponse: {
          source: 'AviationStack flightsFuture API',
          originalCount: departureFlights.length,
          filteredCount: relevantFlights.length,
          transformedCount: transformedFlights.length
        },
        dateValidation: {
          status: 'future',
          requestedDate: params.departureDate,
          isValid: true
        }
      };
      
    } catch (error) {
      console.error('[AVIATION STACK] Future flights error:', error.response ? error.response.data : error.message);
      
      if (error.response && error.response.data) {
        const apiError = error.response.data.error;
        if (apiError && apiError.code === 'rate_limit_reached') {
          console.log('[AVIATION STACK] Rate limit reached, generating synthetic future flights');
          return this.generateSyntheticFutureFlights(params);
        }
        throw new Error(apiError ? apiError.message : 'Failed to search future flights');
      }
      
      throw new Error('Failed to search future flights: ' + error.message);
    }
  }

  generateSyntheticFutureFlights(params) {
    console.log('[AVIATION STACK] Generating synthetic future flights for:', params);
    
    const syntheticFlights = [];
    const baseTime = new Date(params.departureDate + 'T06:00:00');
    
    // Generate some realistic flights
    const airlines = [
      { name: 'American Airlines', code: 'AA' },
      { name: 'Delta Air Lines', code: 'DL' },
      { name: 'United Airlines', code: 'UA' },
      { name: 'Southwest Airlines', code: 'WN' },
      { name: 'JetBlue Airways', code: 'B6' }
    ];
    
    for (let i = 0; i < 5; i++) {
      const airline = airlines[i % airlines.length];
      const flightNumber = Math.floor(Math.random() * 9000) + 1000;
      const departureTime = new Date(baseTime.getTime() + (i * 2 * 60 * 60 * 1000)); // 2 hours apart
      const arrivalTime = new Date(departureTime.getTime() + (3.5 * 60 * 60 * 1000)); // 3.5 hour flight
      
      const flight = {
        id: `${airline.code}${flightNumber}`,
        airline: airline.name,
        flightNumber: `${airline.code}${flightNumber}`,
        origin: {
          iataCode: params.originLocationCode,
          name: this.getAirportName(params.originLocationCode),
          city: this.getAirportCity(params.originLocationCode),
          country: 'United States'
        },
        destination: {
          iataCode: params.destinationLocationCode,
          name: this.getAirportName(params.destinationLocationCode),
          city: this.getAirportCity(params.destinationLocationCode),
          country: 'United States'
        },
        departureDate: departureTime.toISOString().split('T')[0],
        departureTime: departureTime.toISOString().split('T')[1].substring(0, 5),
        arrivalDate: arrivalTime.toISOString().split('T')[0],
        arrivalTime: arrivalTime.toISOString().split('T')[1].substring(0, 5),
        duration: '3h 30m',
        price: this.calculatePrice(params.travelClass, '3h 30m'),
        class: params.travelClass || 'ECONOMY',
        status: 'scheduled',
        isRealData: false // Mark as synthetic
      };
      
      syntheticFlights.push(flight);
    }
    
    return {
      flights: syntheticFlights,
      apiResponse: {
        source: 'Synthetic data (rate limited)',
        originalCount: 5,
        filteredCount: 5,
        transformedCount: 5
      },
      dateValidation: {
        status: 'future_synthetic',
        requestedDate: params.departureDate,
        isValid: true
      }
    };
  }

  getAirportName(iataCode) {
    const airportNames = {
      'DFW': 'Dallas/Fort Worth International',
      'JFK': 'John F. Kennedy International',
      'LAX': 'Los Angeles International',
      'LGA': 'LaGuardia Airport',
      'ORD': 'O\'Hare International',
      'ATL': 'Hartsfield-Jackson Atlanta International',
      'MIA': 'Miami International',
      'SFO': 'San Francisco International',
      'BOS': 'Logan International',
      'SEA': 'Seattle-Tacoma International'
    };
    return airportNames[iataCode] || `${iataCode} Airport`;
  }

  getAirportCity(iataCode) {
    const airportCities = {
      'DFW': 'Dallas',
      'JFK': 'New York',
      'LAX': 'Los Angeles',
      'LGA': 'New York',
      'ORD': 'Chicago',
      'ATL': 'Atlanta',
      'MIA': 'Miami',
      'SFO': 'San Francisco',
      'BOS': 'Boston',
      'SEA': 'Seattle'
    };
    return airportCities[iataCode] || 'Unknown';
  }

  getServiceStatus() {
    const isApiKeyConfigured = !!(API_KEY && API_KEY.length > 5);
    const cachingStatus = RedisCache.getStatus();
    
    return {
      name: 'AviationStack API',
      apiKeyConfigured: isApiKeyConfigured,
      status: 'operational',
      lastChecked: new Date().toISOString(),
      caching: cachingStatus
    };
  }
}

module.exports = new AviationStackService(); 