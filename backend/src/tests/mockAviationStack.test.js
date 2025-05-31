/**
 * Mock AviationStack Service Test Script
 * 
 * This script tests the mockAviationStack service by:
 * 1. Testing the searchAirports function
 * 2. Testing the searchFlights function
 * 3. Testing error handling
 * 4. Displaying results in a clean, readable format
 */

// Import the mockAviationStack service
const mockAviationStack = require('../services/mockAviationStack');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test parameters
const TEST_PARAMS = {
  airports: [
    { name: 'London', description: 'Major international airport hub' },
    { name: 'New York', description: 'US major city' },
    { name: 'Tokyo', description: 'Asian major hub' }
  ],
  flights: [
    {
      params: {
        originLocationCode: 'LHR',      // London Heathrow
        destinationLocationCode: 'JFK', // New York JFK
        departureDate: new Date().toISOString().split('T')[0], // Today's date
        adults: 1,
        travelClass: 'ECONOMY'
      },
      description: 'London to New York (Economy)'
    },
    {
      params: {
        originLocationCode: 'CDG',      // Paris Charles de Gaulle
        destinationLocationCode: 'LAX', // Los Angeles
        departureDate: new Date().toISOString().split('T')[0], // Today's date
        adults: 2,
        travelClass: 'BUSINESS'
      },
      description: 'Paris to Los Angeles (Business)'
    }
  ]
};

/**
 * Prints a section header to the console
 */
function printHeader(title) {
  console.log(`\n${colors.blue}${colors.bold}=== ${title} ===${colors.reset}`);
}

/**
 * Prints a test result to the console
 */
function printResult(success, message, data = null) {
  const icon = success ? '✓' : '✗';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${message}${colors.reset}`);
  
  if (data) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

/**
 * Test the searchAirports function
 */
async function testSearchAirports() {
  printHeader('Testing Airport Search Functionality');
  
  let allTestsPassed = true;
  
  for (const test of TEST_PARAMS.airports) {
    console.log(`\n${colors.cyan}Searching for airports matching: "${test.name}" (${test.description})${colors.reset}`);
    
    try {
      const airports = await mockAviationStack.searchAirports(test.name);
      
      if (!airports || airports.length === 0) {
        printResult(false, `No airports found for "${test.name}"`);
        allTestsPassed = false;
        continue;
      }
      
      printResult(true, `Found ${airports.length} airports matching "${test.name}"`, airports[0]);
      
    } catch (error) {
      printResult(false, `Error searching for "${test.name}"`, error.message);
      
      // Print detailed error information
      if (error.response) {
        console.error(`${colors.red}API Response Error:${colors.reset}`);
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      }
      
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Test the searchFlights function
 */
async function testSearchFlights() {
  printHeader('Testing Flight Search Functionality');
  
  let allTestsPassed = true;
  
  for (const test of TEST_PARAMS.flights) {
    console.log(`\n${colors.cyan}Searching for flights: ${test.description}${colors.reset}`);
    console.log('Parameters:', JSON.stringify(test.params, null, 2));
    
    try {
      const flights = await mockAviationStack.searchFlights(test.params);
      
      if (!flights) {
        printResult(false, 'Flight search returned null or undefined');
        allTestsPassed = false;
        continue;
      }
      
      if (flights.length === 0) {
        printResult(true, 'No flights found for the specified route and date. This is not necessarily an error.');
        continue;
      }
      
      printResult(true, `Found ${flights.length} flights`, flights[0]);
      
    } catch (error) {
      printResult(false, 'Error searching for flights', error.message);
      
      // More detailed error information
      if (error.response) {
        console.error(`${colors.red}API Response Error:${colors.reset}`);
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      }
      
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.bold}${colors.magenta}Mock AviationStack API Test Script${colors.reset}`);
  console.log(`${colors.magenta}Running tests at: ${new Date().toLocaleString()}${colors.reset}`);
  
  try {
    // Step 1: Test airport search
    const airportTestsPassed = await testSearchAirports();
    
    // Step 2: Test flight search
    const flightTestsPassed = await testSearchFlights();
    
    // Print test summary
    printHeader('Test Summary');
    printResult(airportTestsPassed, 'Airport search tests');
    printResult(flightTestsPassed, 'Flight search tests');
    
    const allPassed = airportTestsPassed && flightTestsPassed;
    console.log(`\n${allPassed ? colors.green : colors.yellow}${colors.bold}Test Results: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}${colors.reset}\n`);
    
    console.log(`${colors.yellow}Note: Some tests may have failed due to simulated random API errors.${colors.reset}`);
    console.log(`${colors.yellow}This is expected behavior to test error handling in the application.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error running tests:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
runTests();

