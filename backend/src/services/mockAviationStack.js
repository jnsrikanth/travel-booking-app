/**
 * Mock AviationStack API Service
 * 
 * This module provides a mock implementation of the AviationStack API service
 * for development and testing purposes. It mimics the behavior of the real API
 * but returns realistic mock data instead of making actual API calls.
 * 
 * The mock service:
 * 1. Implements the same interface as the real AviationStack service
 * 2. Returns realistic mock data in the same format
 * 3. Includes common airports and sample flight routes
 * 4. Simulates API response delays and error scenarios
 */

// Mock data for airports
const MOCK_AIRPORTS = [
  // Major international airports
  {
    iataCode: 'LHR',
    name: 'Heathrow Airport',
    city: 'London',
    country: 'United Kingdom'
  },
  {
    iataCode: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States'
  },
  {
    iataCode: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States'
  },
  {
    iataCode: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States'
  },
  {
    iataCode: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France'
  },
  {
    iataCode: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates'
  },
  {
    iataCode: 'HND',
    name: 'Tokyo Haneda Airport',
    city: 'Tokyo',
    country: 'Japan'
  },
  {
    iataCode: 'SYD',
    name: 'Sydney Airport',
    city: 'Sydney',
    country: 'Australia'
  },
  {
    iataCode: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore'
  },
  {
    iataCode: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany'
  },
  {
    iataCode: 'DEL',
    name: 'Indira Gandhi International Airport',
    city: 'Delhi',
    country: 'India'
  },
  {
    iataCode: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
    city: 'Mumbai',
    country: 'India'
  }
];

// Mock data for airlines
const MOCK_AIRLINES = [
  { code: 'BA', name: 'British Airways' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'EK', name: 'Emirates' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'QF', name: 'Qantas' },
  { code: 'AI', name: 'Air India' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'CX', name: 'Cathay Pacific' }
];

// Common routes with realistic flight durations (in minutes)
const FLIGHT_ROUTES = [
  { from: 'LHR', to: 'JFK', duration: 470 },  // London to New York
  { from: 'JFK', to: 'LHR', duration: 380 },  // New York to London (jet stream)
  { from: 'LHR', to: 'LAX', duration: 650 },  // London to Los Angeles
  { from: 'LAX', to: 'LHR', duration: 590 },  // Los Angeles to London
  { from: 'CDG', to: 'JFK', duration: 480 },  // Paris to New York
  { from: 'JFK', to: 'CDG', duration: 420 },  // New York to Paris
  { from: 'LHR', to: 'SYD', duration: 1260 }, // London to Sydney
  { from: 'SYD', to: 'LHR', duration: 1320 }, // Sydney to London
  { from: 'SFO', to: 'HND', duration: 650 },  // San Francisco to Tokyo
  { from: 'HND', to: 'SFO', duration: 580 },  // Tokyo to San Francisco
  { from: 'DXB', to: 'JFK', duration: 800 },  // Dubai to New York
  { from: 'JFK', to: 'DXB', duration: 770 },  // New York to Dubai
  { from: 'FRA', to: 'SIN', duration: 720 },  // Frankfurt to Singapore
  { from: 'SIN', to: 'FRA', duration: 780 },  // Singapore to Frankfurt
  { from: 'DEL', to: 'LHR', duration: 590 },  // Delhi to London
  { from: 'LHR', to: 'DEL', duration: 510 },  // London to Delhi
  { from: 'BOM', to: 'JFK', duration: 960 },  // Mumbai to New York
  { from: 'JFK', to: 'BOM', duration: 880 }   // New York to Mumbai
];

// Function to simulate network delay
const simulateDelay = async (min = 200, max = 800) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Function to simulate API errors occasionally
const maybeThrowError = (errorRate = 0.05) => {
  if (Math.random() < errorRate) {
    const errorTypes = [
      { status: 401, message: 'Invalid or missing API key' },
      { status: 403, message: 'Function access restricted. Your current subscription plan does not support this API endpoint.' },
      { status: 429, message: 'Rate limit exceeded. Please upgrade your subscription plan for higher limits.' },
      { status: 500, message: 'Internal server error. Please try again later.' }
    ];
    
    const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    const apiError = new Error(error.message);
    apiError.response = { 
      status: error.status, 
      data: {
        error: {
          code: error.status.toString(),
          message: error.message
        }
      }
    };
    throw apiError;
  }
};

/**
 * Find an airport by IATA code
 * @param {string} iataCode - IATA airport code
 * @returns {Object|null} Airport object or null if not found
 */
const findAirport = (iataCode) => {
  return MOCK_AIRPORTS.find(airport => airport.iataCode === iataCode) || null;
};

/**
 * Search for airports based on a keyword
 * @param {string} keyword - Search keyword (city, airport name, country, or IATA code)
 * @returns {Promise<Array>} List of airports matching the keyword
 */
const searchAirports = async (keyword) => {
  if (!keyword) return [];
  
  // Simulate network delay
  await simulateDelay();
  
  // Occasionally throw an error
  maybeThrowError();
  
  // Case-insensitive search across all airport properties
  const searchTerm = keyword.toLowerCase();
  return MOCK_AIRPORTS.filter(airport => 
    airport.iataCode.toLowerCase().includes(searchTerm) ||
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.country.toLowerCase().includes(searchTerm)
  );
};

/**
 * Generate a realistic departure and arrival time based on the time of day
 * @param {string} departureDate - Departure date in YYYY-MM-DD format
 * @param {number} durationMinutes - Flight duration in minutes
 * @returns {Object} Object with departureTime and arrivalTime as Date objects
 */
const generateFlightTimes = (departureDate, durationMinutes) => {
  const date = new Date(departureDate);
  
  // Random departure hour between 6 AM and 10 PM
  const departureHour = 6 + Math.floor(Math.random() * 16);
  const departureMinute = Math.floor(Math.random() * 60);
  
  date.setHours(departureHour, departureMinute, 0, 0);
  const departureTime = new Date(date);
  
  // Calculate arrival time based on duration
  const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);
  
  return { departureTime, arrivalTime };
};

/**
 * Format a date to time string (HH:MM)
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Search for real-time flights based on given parameters
 * @param {Object} params - Search parameters
 * @param {string} params.originLocationCode - Origin airport IATA code
 * @param {string} params.destinationLocationCode - Destination airport IATA code
 * @param {string} params.departureDate - Departure date in YYYY-MM-DD format
 * @param {string} params.returnDate - Return date in YYYY-MM-DD format (optional)
 * @param {number} params.adults - Number of adult passengers
 * @param {string} params.travelClass - Travel class (e.g., ECONOMY, BUSINESS)
 * @returns {Promise<Array>} List of flights matching the criteria
 */
const searchFlights = async (params) => {
  const {
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    adults = 1,
    travelClass = 'ECONOMY'
  } = params;

  // Simulate network delay
  await simulateDelay();
  
  // Occasionally throw an error
  maybeThrowError();

  // Find route
  const route = FLIGHT_ROUTES.find(
    route => route.from === originLocationCode && route.to === destinationLocationCode
  );
  
  // If no route is found, return empty array
  if (!route) {
    return [];
  }
  
  // Find origin and destination airports
  const origin = findAirport(originLocationCode);
  const destination = findAirport(destinationLocationCode);
  
  if (!origin || !destination) {
    return [];
  }
  
  // Generate between 1-5 flights for this route
  const numberOfFlights = 1 + Math.floor(Math.random() * 5);
  const flights = [];
  
  for (let i = 0; i < numberOfFlights; i++) {
    // Randomly select an airline
    const airline = MOCK_AIRLINES[Math.floor(Math.random() * MOCK_AIRLINES.length)];
    
    // Generate flight times
    const { departureTime, arrivalTime } = generateFlightTimes(departureDate, route.duration);
    
    // Calculate duration string
    const durationHours = Math.floor(route.duration / 60);
    const durationMinutes = route.duration % 60;
    const duration = `${durationHours}h ${durationMinutes}m`;
    
    // Generate a realistic price
    const basePrice = 20000 + Math.floor(Math.random() * 40000);
    const price = travelClass === 'BUSINESS' ? basePrice * 2.5 : basePrice;
    
    // Flight number: airline code + 3-4 digit number
    const flightNumber = `${airline.code}${100 + Math.floor(Math.random() * 900)}`;
    
    // Create flight object
    flights.push({
      id: `MOCK-${flightNumber}-${i}`,
      airline: airline.name,
      origin: {
        iataCode: origin.iataCode,
        name: origin.name,
        city: origin.city,
        country: origin.country
      },
      destination: {
        iataCode: destination.iataCode,
        name: destination.name,
        city: destination.city,
        country: destination.country
      },
      departureDate: departureDate,
      departureTime: formatTime(departureTime),
      arrivalDate: new Date(arrivalTime).toISOString().split('T')[0], // Handle next day arrivals
      arrivalTime: formatTime(arrivalTime),
      duration,
      price,
      class: travelClass,
      seats: 10 + Math.floor(Math.random() * 90), // Random available seats
      flightNumber
    });
  }
  
  return flights;
};

module.exports = {
  searchFlights,
  searchAirports
};

