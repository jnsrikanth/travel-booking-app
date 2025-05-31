/**
 * AviationStack API Test Script
 * 
 * This script makes a direct call to the AviationStack API to check for 
 * TODAY's flights between DFW and SFO, logging the raw API response.
 * It clearly distinguishes between real API data and mock data.
 */

require('dotenv').config();
const axios = require('axios');
const { generateMockFlights } = require('./src/services/mockFlights');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// AviationStack API constants
const AVIATION_STACK_BASE_URL = 'http://api.aviationstack.com/v1';
const API_KEY = process.env.AVIATION_STACK_API_KEY;

// Test parameters
const originIATA = 'DFW'; // Dallas/Fort Worth
const destinationIATA = 'SFO'; // San Francisco
const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

// Print banner
console.log(`${colors.bold}${colors.cyan}================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}    AVIATIONSTACK API TEST - REAL VS MOCK DATA   ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================${colors.reset}`);
console.log();

// Print test configuration
console.log(`${colors.bold}Test Configuration:${colors.reset}`);
console.log(`- Origin: ${colors.green}${originIATA}${colors.reset} (Dallas/Fort Worth)`);
console.log(`- Destination: ${colors.green}${destinationIATA}${colors.reset} (San Francisco)`);
console.log(`- Date: ${colors.green}${today}${colors.reset} (Today)`);
console.log(`- API Key: ${API_KEY ? colors.green + '✓ Configured' + colors.reset : colors.red + '✗ Missing' + colors.reset}`);
console.log();

/**
 * Make a real API call to AviationStack for today's flights
 */
async function testRealApiData() {
  console.log(`${colors.bold}${colors.blue}Testing REAL AviationStack API:${colors.reset}`);
  console.log(`Making API request to ${AVIATION_STACK_BASE_URL}/flights`);
  
  if (!API_KEY) {
    console.error(`${colors.red}Error: AVIATION_STACK_API_KEY is not set in your environment variables${colors.reset}`);
    return null;
  }
  
  try {
    console.log(`${colors.cyan}Sending request...${colors.reset}`);
    
    const response = await axios.get(`${AVIATION_STACK_BASE_URL}/flights`, {
      params: {
        access_key: API_KEY,
        dep_iata: originIATA,
        arr_iata: destinationIATA,
        flight_date: today,
        limit: 10
      }
    });
    
    console.log(`${colors.green}Response received! Status: ${response.status}${colors.reset}`);
    console.log();
    
    // Check pagination info
    if (response.data.pagination) {
      console.log(`${colors.bold}Pagination:${colors.reset}`);
      console.log(`- Total results: ${colors.yellow}${response.data.pagination.total}${colors.reset}`);
      console.log(`- Limit: ${response.data.pagination.limit}`);
      console.log(`- Offset: ${response.data.pagination.offset}`);
      console.log(`- Count: ${response.data.pagination.count}`);
      console.log();
    }
    
    // Check data
    if (response.data.data && Array.isArray(response.data.data)) {
      const flightCount = response.data.data.length;
      
      if (flightCount > 0) {
        console.log(`${colors.bold}${colors.green}✓ REAL DATA: Found ${flightCount} flights today from ${originIATA} to ${destinationIATA}${colors.reset}`);
        console.log();
        
        // Print the first flight details as an example
        console.log(`${colors.bold}Sample Real Flight Data (First Result):${colors.reset}`);
        const flight = response.data.data[0];
        console.log(JSON.stringify(flight, null, 2));
        console.log();
        
        return response.data.data;
      } else {
        console.log(`${colors.bold}${colors.yellow}⚠ NO REAL DATA: No flights found today from ${originIATA} to ${destinationIATA}${colors.reset}`);
        console.log(`${colors.yellow}This is expected for certain routes or if there are no scheduled flights for today.${colors.reset}`);
        console.log(`${colors.yellow}AviationStack free tier only provides real-time/historical data, not future schedules.${colors.reset}`);
        console.log();
        return [];
      }
    } else {
      console.log(`${colors.bold}${colors.red}✗ INVALID RESPONSE: Data field missing or not an array${colors.reset}`);
      console.log(`Raw response:`, JSON.stringify(response.data, null, 2));
      console.log();
      return null;
    }
  } catch (error) {
    console.error(`${colors.bold}${colors.red}✗ API ERROR:${colors.reset}`);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`No response received from API. Network issues or API down.`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Error message: ${error.message}`);
    }
    
    console.error();
    return null;
  }
}

/**
 * Generate mock flight data and display it
 */
function testMockData() {
  console.log(`${colors.bold}${colors.magenta}Testing MOCK Flight Data:${colors.reset}`);
  
  const searchParams = {
    originLocationCode: originIATA,
    destinationLocationCode: destinationIATA,
    departureDate: today,
    adults: 1,
    travelClass: 'ECONOMY'
  };
  
  const mockFlights = generateMockFlights(searchParams);
  
  console.log(`${colors.bold}${colors.magenta}✓ MOCK DATA: Generated ${mockFlights.length} mock flights${colors.reset}`);
  console.log();
  
  // Print a sample mock flight
  if (mockFlights.length > 0) {
    console.log(`${colors.bold}Sample Mock Flight Data (First Result):${colors.reset}`);
    console.log(JSON.stringify(mockFlights[0], null, 2));
    console.log();
  }
  
  return mockFlights;
}

/**
 * Compare real and mock data
 */
function compareData(realFlights, mockFlights) {
  console.log(`${colors.bold}${colors.cyan}Comparison between Real and Mock Data:${colors.reset}`);
  
  if (!realFlights || realFlights.length === 0) {
    console.log(`${colors.yellow}No real flight data available for comparison.${colors.reset}`);
    console.log(`${colors.yellow}In your web application, you would see mock data for this route.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.bold}Key Differences:${colors.reset}`);
  console.log(`1. ${colors.green}Real data${colors.reset} is from the actual AviationStack API and represents ${colors.bold}current flights${colors.reset}`);
  console.log(`2. ${colors.magenta}Mock data${colors.reset} is generated within our application for demonstration purposes`);
  console.log(`3. Real data has different structure and field names than our application expects`);
  console.log(`4. Our application transforms the real data to match our frontend requirements`);
  console.log();
  
  console.log(`${colors.bold}When You'll See Mock Data:${colors.reset}`);
  console.log(`1. When searching for ${colors.bold}future dates${colors.reset} (AviationStack free tier limitation)`);
  console.log(`2. When no real flights are found for a specific route`);
  console.log(`3. When the API returns an error or invalid response`);
  console.log();
}

/**
 * Main test function
 */
async function runTest() {
  // Test real API data
  const realFlights = await testRealApiData();
  
  // Test mock data
  const mockFlights = testMockData();
  
  // Compare the data
  compareData(realFlights, mockFlights);
  
  console.log(`${colors.bold}${colors.cyan}================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                 TEST COMPLETE                   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================${colors.reset}`);
}

// Run the test
runTest().catch(error => {
  console.error(`${colors.red}Unhandled error in test:${colors.reset}`, error);
});

