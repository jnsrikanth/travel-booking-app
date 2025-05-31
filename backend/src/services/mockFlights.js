/**
 * Mock Flight Data Generator
 * 
 * This module provides mock flight data for demonstration purposes,
 * particularly when the AviationStack API cannot provide data for future dates.
 */

const airlines = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'WN', name: 'Southwest Airlines' },
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines' }
];

const airports = {
  // US Airports
  'DFW': { name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States' },
  'LAX': { name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
  'JFK': { name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  'SFO': { name: 'San Francisco International', city: 'San Francisco', country: 'United States' },
  'ORD': { name: 'O\'Hare International', city: 'Chicago', country: 'United States' },
  'MIA': { name: 'Miami International', city: 'Miami', country: 'United States' },
  'ATL': { name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'United States' },
  'LAS': { name: 'Harry Reid International', city: 'Las Vegas', country: 'United States' },
  
  // International Airports
  'LHR': { name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  'AMS': { name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  'MAD': { name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain' },
  'FCO': { name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'Italy' },
  'DXB': { name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  'SYD': { name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  'HND': { name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' },
  'PEK': { name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China' }
};

/**
 * Get airport details by IATA code
 * @param {string} iataCode - IATA airport code
 * @returns {Object} Airport details
 */
const getAirportDetails = (iataCode) => {
  return airports[iataCode] || { 
    name: `${iataCode} International Airport`, 
    city: iataCode, 
    country: 'Unknown' 
  };
};

/**
 * Generate departure and arrival times for a flight
 * @param {string} date - Flight date in YYYY-MM-DD format
 * @returns {Object} Departure and arrival times
 */
const generateFlightTimes = (date) => {
  // Generate departure time between 6AM and 10PM
  const departureHour = 6 + Math.floor(Math.random() * 16);
  const departureMinute = Math.floor(Math.random() * 60);
  
  // Flight duration between 1 and 6 hours
  const durationHours = 1 + Math.floor(Math.random() * 5);
  const durationMinutes = Math.floor(Math.random() * 60);
  
  // Calculate arrival time
  let arrivalHour = (departureHour + durationHours) % 24;
  let arrivalMinute = (departureMinute + durationMinutes) % 60;
  let arrivalDate = date;
  
  // If flight crosses midnight, adjust date
  if (departureHour + durationHours >= 24) {
    // Create new date object and add one day
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    arrivalDate = nextDay.toISOString().split('T')[0];
  }
  
  // Format times as HH:MM
  const departureTime = `${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}`;
  const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMinute).padStart(2, '0')}`;
  
  return {
    departureTime,
    arrivalTime,
    arrivalDate,
    duration: `${durationHours}h ${durationMinutes}m`
  };
};

/**
 * Generate a price based on route and class
 * @param {string} origin - Origin IATA code
 * @param {string} destination - Destination IATA code
 * @param {string} travelClass - Travel class
 * @returns {number} Flight price
 */
const generatePrice = (origin, destination, travelClass) => {
  const isInternational = 
    (origin in airports && destination in airports) && 
    (airports[origin].country !== airports[destination].country);
  
  // Base price between $250-$500 for domestic, $500-$1200 for international
  const baseMin = isInternational ? 50000 : 25000;
  const baseMax = isInternational ? 120000 : 50000;
  let price = baseMin + Math.floor(Math.random() * (baseMax - baseMin));
  
  // Adjust for class
  if (travelClass === 'BUSINESS') {
    price *= 2.5;
  } else if (travelClass === 'FIRST') {
    price *= 4;
  }
  
  return Math.round(price);
};

/**
 * Generate mock flights for a specific route and date
 * @param {Object} params - Search parameters
 * @returns {Array} List of mock flights
 */
const generateMockFlights = (params) => {
  console.log('Generating mock flight data:', JSON.stringify(params));
  
  const {
    originLocationCode,
    destinationLocationCode,
    departureDate,
    travelClass = 'ECONOMY'
  } = params;
  
  // Get origin and destination airport details
  const origin = getAirportDetails(originLocationCode);
  const destination = getAirportDetails(destinationLocationCode);
  
  // Number of flights to generate (3-8)
  const numFlights = 3 + Math.floor(Math.random() * 6);
  const flights = [];
  
  // Generate the specified number of flights
  for (let i = 0; i < numFlights; i++) {
    // Pick a random airline
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    
    // Generate flight times
    const times = generateFlightTimes(departureDate);
    
    // Generate flight number
    const flightNumber = `${airline.code}${100 + Math.floor(Math.random() * 900)}`;
    
    // Generate price
    const price = generatePrice(originLocationCode, destinationLocationCode, travelClass);
    
    // Create flight object
    flights.push({
      id: `MOCK-${flightNumber}`,
      airline: airline.name,
      origin: {
        iataCode: originLocationCode,
        name: origin.name,
        city: origin.city,
        country: origin.country
      },
      destination: {
        iataCode: destinationLocationCode,
        name: destination.name,
        city: destination.city,
        country: destination.country
      },
      departureDate,
      departureTime: times.departureTime,
      arrivalDate: times.arrivalDate,
      arrivalTime: times.arrivalTime,
      duration: times.duration,
      price,
      class: travelClass,
      seats: 20 + Math.floor(Math.random() * 180),
      flightNumber,
      isMockData: true // Flag to indicate this is mock data
    });
  }
  
  // Sort flights by departure time
  flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  
  return flights;
};

/**
 * Search for mock airports based on a keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} List of matching airports
 */
const searchMockAirports = (keyword) => {
  if (!keyword || keyword.length < 2) return [];
  
  keyword = keyword.toLowerCase();
  const results = [];
  
  // Search through our airport database
  for (const [iataCode, airport] of Object.entries(airports)) {
    if (
      iataCode.toLowerCase().includes(keyword) ||
      airport.name.toLowerCase().includes(keyword) ||
      airport.city.toLowerCase().includes(keyword) ||
      airport.country.toLowerCase().includes(keyword)
    ) {
      results.push({
        iataCode,
        name: airport.name,
        city: airport.city,
        country: airport.country
      });
    }
  }
  
  return results.slice(0, 10); // Limit to 10 results
};

module.exports = {
  generateMockFlights,
  searchMockAirports
};
