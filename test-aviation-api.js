/**
 * Test script for AviationStack API
 * 
 * This script tests the connection to the AviationStack API by making
 * a simple flight search request and verifying the response.
 */

// Load environment variables
require('dotenv').config();
const aviationStack = require('./backend/src/services/aviationStack');

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
 * Test the AviationStack API connection
 */
async function testAviationStackApi() {
  console.log(`${colors.cyan}Testing AviationStack API connection...${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  
  try {
    // Step 1: Verify that the API key is set
    console.log(`${colors.blue}Step 1: Verifying API key is configured${colors.reset}`);
    const apiKey = process.env.AVIATION_STACK_API_KEY;
    if (!apiKey) {
      throw new Error('AVIATION_STACK_API_KEY environment variable is not set');
    }
    console.log(`${colors.green}✓ API key is configured${colors.reset}`);

    // Step 2: Test airport search functionality
    console.log(`\n${colors.blue}Step 2: Testing airport search functionality${colors.reset}`);
    const searchKeyword = 'London';
    console.log(`Searching for airports matching: "${searchKeyword}"`);
    
    const airports = await aviationStack.searchAirports(searchKeyword);
    if (!airports || airports.length === 0) {
      throw new Error('No airports found. API might be failing or returning empty results.');
    }
    
    console.log(`${colors.green}✓ Successfully retrieved ${airports.length} airports${colors.reset}`);
    console.log('Sample airport data:');
    console.log(JSON.stringify(airports[0], null, 2));

    // Step 3: Test flight search functionality
    console.log(`\n${colors.blue}Step 3: Testing flight search functionality${colors.reset}`);
    
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
      throw new Error('Flight search failed. API might be down or returned an invalid response.');
    }
    
    if (flights.length === 0) {
      console.log(`${colors.yellow}⚠ No flights found for the specified route today.${colors.reset}`);
      console.log(`${colors.yellow}This is not necessarily an error - there might be no flights matching the criteria.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Successfully retrieved ${flights.length} flights${colors.reset}`);
      console.log('Sample flight data:');
      console.log(JSON.stringify(flights[0], null, 2));
    }

    console.log(`\n${colors.green}✓ API connection test completed successfully${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error testing AviationStack API:${colors.reset}`, error);
    
    // More detailed error information
    if (error.response) {
      console.error(`${colors.red}API Response Error:${colors.reset}`);
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else if (error.request) {
      console.error(`${colors.red}No response received from API. Network issue or API down.${colors.reset}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testAviationStackApi();

