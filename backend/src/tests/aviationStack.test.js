/**
 * AviationStack Service Minimal API Test Script
 * 
 * This script performs a minimal test of the AviationStack API by:
 * 1. Testing only the searchAirports function with a single query
 * 2. Displaying rate limit information to monitor API usage
 * 3. Providing clear success/failure messaging
 * 4. Minimizing API calls to conserve rate limits
 * 
 * Run with: node backend/src/tests/aviationStack.test.js
 */

// Load environment variables
require('dotenv').config();

// Import the AviationStack service
const aviationStack = require('../services/aviationStack');

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

// Test parameters - minimized to a single airport query to conserve API credits
const TEST_PARAMS = {
  airports: [
    { name: 'London', description: 'Major international airport hub' }
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
      // Only print the first item to keep output minimal
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

/**
 * Display rate limit information from the API response
 */
function displayRateLimitInfo(response) {
  if (!response || !response.headers) {
    console.log(`${colors.yellow}No response headers available to check rate limits${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.blue}${colors.bold}=== API Rate Limit Information ===${colors.reset}`);
  
  // Common rate limit header patterns
  const rateLimitHeaders = {
    'x-ratelimit-limit': 'Rate Limit Total',
    'x-ratelimit-remaining': 'Rate Limit Remaining',
    'x-ratelimit-reset': 'Rate Limit Reset Time',
    'ratelimit-limit': 'Rate Limit Total',
    'ratelimit-remaining': 'Rate Limit Remaining',
    'ratelimit-reset': 'Rate Limit Reset Time',
    'x-rate-limit-limit': 'Rate Limit Total',
    'x-rate-limit-remaining': 'Rate Limit Remaining',
    'x-rate-limit-reset': 'Rate Limit Reset Time'
  };

  let foundRateLimitInfo = false;
  
  // Check for rate limit headers
  Object.keys(rateLimitHeaders).forEach(header => {
    if (response.headers[header]) {
      console.log(`${colors.cyan}${rateLimitHeaders[header]}: ${colors.reset}${response.headers[header]}`);
      foundRateLimitInfo = true;
    }
  });
  
  // If none of the expected headers were found, try to display all headers for investigation
  if (!foundRateLimitInfo) {
    console.log(`${colors.yellow}No standard rate limit headers found. All response headers:${colors.reset}`);
    Object.keys(response.headers).forEach(header => {
      console.log(`${colors.cyan}${header}: ${colors.reset}${response.headers[header]}`);
    });
  }
}

/**
 * Verify the API key is configured
 */
function verifyApiKey() {
  printHeader('Verifying API Key Configuration');
  
  const apiKey = process.env.AVIATION_STACK_API_KEY;
  if (!apiKey) {
    printResult(false, 'AVIATION_STACK_API_KEY environment variable is not set');
    console.log(`
${colors.yellow}To set up your API key:${colors.reset}
1. Sign up at https://aviationstack.com/ to get an API key
2. Create a .env file in the project root if it doesn't exist
3. Add the following line to your .env file:
   AVIATION_STACK_API_KEY=your_api_key_here
4. Restart your application or run this test again
`);
    return false;
  }
  
  printResult(true, 'API key is configured');
  return true;
}

/**
 * Test the searchAirports function
 */
async function testSearchAirports() {
  printHeader('Testing Airport Search Functionality');
  
  let allTestsPassed = true;
  let apiResponse = null;
  
  for (const test of TEST_PARAMS.airports) {
    console.log(`\n${colors.cyan}Searching for airports matching: "${test.name}" (${test.description})${colors.reset}`);
    
    try {
      // Modify the aviationStack service call to capture the full response with headers
      const result = await aviationStack.searchAirportsWithFullResponse(test.name);
      const airports = result.data;
      apiResponse = result.response;
      
      if (!airports || airports.length === 0) {
        printResult(false, `No airports found for "${test.name}"`);
        allTestsPassed = false;
        continue;
      }
      
      // Show subscription status and plan info
      if (apiResponse.data && apiResponse.data.error) {
        const error = apiResponse.data.error;
        console.log(`\n${colors.yellow}${colors.bold}API Subscription Status:${colors.reset}`);
        console.log(`Code: ${error.code}`);
        console.log(`Message: ${error.message}`);
        console.log(`Info: ${error.info || 'No additional info'}`);
        
        // Check specifically for subscription/access related errors
        if (error.code === 'function_access_restricted') {
          console.log(`\n${colors.red}${colors.bold}This endpoint is not available on your current subscription plan.${colors.reset}`);
          console.log(`${colors.yellow}Consider upgrading your AviationStack plan to access this feature.${colors.reset}`);
        }
      } else {
        printResult(true, `Found ${airports.length} airports matching "${test.name}"`, airports[0]);
        console.log(`\n${colors.green}${colors.bold}API ACCESS CONFIRMED:${colors.reset} Your subscription can access the airports endpoint.`);
      }
      
    } catch (error) {
      printResult(false, `Error searching for "${test.name}"`, error.message);
      allTestsPassed = false;
      
      // Provide more detailed error analysis
      if (error.response) {
        console.log(`\n${colors.red}${colors.bold}API Error Response:${colors.reset}`);
        console.log(`Status: ${error.response.status}`);
        
        if (error.response.data && error.response.data.error) {
          const apiError = error.response.data.error;
          console.log(`Code: ${apiError.code}`);
          console.log(`Message: ${apiError.message}`);
          console.log(`Info: ${apiError.info || 'No additional info'}`);
          
          // Subscription plan issue detection
          if (apiError.code === 'function_access_restricted') {
            console.log(`\n${colors.yellow}${colors.bold}Subscription Plan Issue:${colors.reset} This endpoint requires a higher tier plan.`);
          }
        }
        
        // Capture the response for rate limit checking
        apiResponse = error.response;
      } else if (error.request) {
        console.log(`\n${colors.red}${colors.bold}Network Error:${colors.reset} No response received from API.`);
        console.log('This could indicate connectivity issues or that the API is currently unavailable.');
      }
    }
  }
  
  // Display rate limit information if we have a response
  if (apiResponse) {
    displayRateLimitInfo(apiResponse);
  }
  
  return allTestsPassed;
}

// Flight search test removed to minimize API calls

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.bold}${colors.magenta}AviationStack API Minimal Test Script${colors.reset}`);
  console.log(`${colors.magenta}Running tests at: ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.yellow}This script makes minimal API calls to conserve your rate limits${colors.reset}`);
  
  try {
    // Step 1: Verify API key
    const apiKeyValid = verifyApiKey();
    if (!apiKeyValid) {
      console.log(`\n${colors.red}${colors.bold}Tests aborted due to missing API key.${colors.reset}`);
      process.exit(1);
    }
    
    // Step 2: Test airport search only (removed flight search to minimize API calls)
    const airportTestsPassed = await testSearchAirports();
    
    // Print test summary
    printHeader('Test Summary');
    printResult(airportTestsPassed, 'Airport search API access test');
    
    const allPassed = apiKeyValid && airportTestsPassed;
    
    // Provide clear next steps based on test results
    if (allPassed) {
      console.log(`\n${colors.green}${colors.bold}✓ API ACCESS VERIFIED${colors.reset}\n`);
      console.log(`${colors.green}Your AviationStack API key is working with the airports endpoint.${colors.reset}`);
      console.log(`${colors.cyan}Next steps:${colors.reset}`);
      console.log(`1. Update the .env file to use this API key for your application`);
      console.log(`2. Check if this subscription plan meets your application needs`);
      console.log(`3. Consider enabling the real API in your backend by updating the mock flag\n`);
    } else {
      console.log(`\n${colors.yellow}${colors.bold}⚠ API ACCESS ISSUES DETECTED${colors.reset}\n`);
      console.log(`${colors.yellow}There were problems accessing the AviationStack API.${colors.reset}`);
      console.log(`${colors.cyan}Troubleshooting steps:${colors.reset}`);
      console.log(`1. Verify your API key is correct`);
      console.log(`2. Check your subscription plan limits`);
      console.log(`3. Continue using the mock service until API access is resolved\n`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error running tests:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
runTests();

