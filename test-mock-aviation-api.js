/**
 * Test script for Mock AviationStack API
 * 
 * This script demonstrates how to use the mockAviationStack service
 * as a drop-in replacement for the real AviationStack API service.
 */

// Load environment variables (not actually needed for mock service but kept for compatibility)
require('dotenv').config();

// Import the mock service instead of the real one
const aviationStack = require('./backend/src/services/mockAviationStack');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test the Mock AviationStack API
 */
async function testMockAviationStackApi() {
  console.log(`${colors.cyan}Testing Mock AviationStack API...${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  
  try {
    // Step 1: Test airport search functionality
    console.log(`\n${colors.blue}Step 1: Testing airport search functionality${colors.reset}`);
    const searchKeyword = 'London';
    console.log(`Searching for airports matching: "${searchKeyword}"`);
    
    const airports = await aviationStack.searchAirports(searchKeyword);
    if (!airports || airports.length === 0) {
      throw new Error('No airports found. This might be due to a simulated error or empty results.');
    }
    
    console.log(`${colors.green}✓ Successfully retrieved ${airports.length} airports${colors.reset}`);
    console.log('Sample airport data:');
    console.log(JSON.stringify(airports[0], null, 2));

    // Step 2: Test flight search functionality
    console.log(`\n${colors.blue}Step 2: Testing flight search functionality${colors.reset}`);
    
    // Using sample flight search parameters
    const flightParams = {
      originLocationCode: 'LHR',      // London Heathrow
      destinationLocationCode: 'JFK', // New York JFK
      departureDate: new Date().toISOString().split('T')[0], // Today's date
      adults: 1,
      travelClass: 'ECONOMY'
    };
    
    console.log('Searching for flights with parameters:');
    console.log(JSON.stringify(flightParams, null, 2));
    
    const flights = await aviationStack.searchFlights(flightParams);
    
    if (!flights) {
      throw new Error('Flight search failed. This might be due to a simulated error.');
    }
    
    if (flights.length === 0) {
      console.log(`${colors.yellow}⚠ No flights found for the specified route today.${colors.reset}`);
      console.log(`${colors.yellow}This is not necessarily an error - there might be no flights matching the criteria.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Successfully retrieved ${flights.length} flights${colors.reset}`);
      console.log('Sample flight data:');
      console.log(JSON.stringify(flights[0], null, 2));
    }

    console.log(`\n${colors.green}✓ Mock API test completed successfully${colors.reset}`);
    console.log(`${colors.yellow}Note: The mock service occasionally simulates API errors to test error handling.${colors.reset}`);
    console.log(`${colors.yellow}If you encounter an error, please run the test again.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error testing Mock AviationStack API:${colors.reset}`, error);
    
    // More detailed error information
    if (error.response) {
      console.error(`${colors.red}API Response Error (Simulated):${colors.reset}`);
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
      console.log(`\n${colors.yellow}This is a simulated error from the mock service.${colors.reset}`);
      console.log(`${colors.yellow}In a real application, your error handling code would handle this gracefully.${colors.reset}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testMockAviationStackApi();

