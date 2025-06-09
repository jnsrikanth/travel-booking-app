#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors/safe');

// Configuration
const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper functions
function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(colors.green(`✓ ${testName}`));
  } else {
    failedTests++;
    console.log(colors.red(`✗ ${testName}`));
    if (details) console.log(colors.yellow(`  Details: ${details}`));
  }
}

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    const response = await axios.get(url);
    const passed = response.status === expectedStatus;
    logTest(name, passed, passed ? '' : `Expected status ${expectedStatus}, got ${response.status}`);
    return response.data;
  } catch (error) {
    logTest(name, false, error.message);
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log(colors.cyan('\n🧪 COMPREHENSIVE FLIGHT SEARCH APP TESTING\n'));
  console.log(colors.gray('=' .repeat(50)));

  // 1. Backend Health Check
  console.log(colors.yellow('\n1. Backend Health Checks:'));
  const health = await testEndpoint('Backend health endpoint', `${BACKEND_URL}/health`);
  if (health) {
    logTest('Backend status is healthy', health.status === 'healthy');
    logTest('API key configured', health.service?.apiKeyConfigured === true);
  }

  // 2. Frontend Availability
  console.log(colors.yellow('\n2. Frontend Availability:'));
  await testEndpoint('Frontend is accessible', FRONTEND_URL);

  // 3. Airport Search Tests
  console.log(colors.yellow('\n3. Airport Search Tests:'));
  
  // Test IATA code search
  const jfkSearch = await testEndpoint('Search by IATA code (JFK)', `${FRONTEND_URL}/api/airports?keyword=JFK`);
  if (jfkSearch && jfkSearch.status === 'success') {
    logTest('JFK search returns airports', jfkSearch.data.airports.length > 0);
    const hasJFK = jfkSearch.data.airports.some(a => a.iataCode === 'JFK');
    logTest('JFK search contains JFK airport', hasJFK);
  }

  // Test city name search
  const londonSearch = await testEndpoint('Search by city name (London)', `${FRONTEND_URL}/api/airports?keyword=London`);
  if (londonSearch && londonSearch.status === 'success') {
    logTest('London search returns airports', londonSearch.data.airports.length > 0);
    const hasLondonAirport = londonSearch.data.airports.some(a => 
      a.name.toLowerCase().includes('london') || a.city.toLowerCase().includes('london')
    );
    logTest('London search contains London airports', hasLondonAirport);
  }

  // Test partial search
  const partialSearch = await testEndpoint('Partial search (LA)', `${FRONTEND_URL}/api/airports?keyword=LA`);
  if (partialSearch && partialSearch.status === 'success') {
    logTest('Partial search returns results', partialSearch.data.airports.length > 0);
  }

  // 4. Flight Search Tests
  console.log(colors.yellow('\n4. Flight Search Tests:'));
  
  // Test popular routes
  const routes = [
    { from: 'LAX', to: 'JFK', date: '2024-12-25' },
    { from: 'SFO', to: 'LAX', date: '2024-12-25' },
    { from: 'LHR', to: 'CDG', date: '2024-12-25' }
  ];

  for (const route of routes) {
    const flightSearch = await testEndpoint(
      `Flight search ${route.from} → ${route.to}`,
      `${FRONTEND_URL}/api/flights?originLocationCode=${route.from}&destinationLocationCode=${route.to}&departureDate=${route.date}&adults=1&travelClass=ECONOMY`
    );
    
    if (flightSearch && flightSearch.status === 'success') {
      logTest(`${route.from} → ${route.to} returns flights`, flightSearch.data.flights.length > 0);
      
      if (flightSearch.data.flights.length > 0) {
        const firstFlight = flightSearch.data.flights[0];
        logTest(`${route.from} → ${route.to} flights have prices`, firstFlight.price > 0);
        logTest(`${route.from} → ${route.to} flights have duration`, !!firstFlight.duration);
      }
    }
  }

  // 5. Error Handling Tests
  console.log(colors.yellow('\n5. Error Handling Tests:'));
  
  // Test missing parameters
  const missingParam = await axios.get(`${FRONTEND_URL}/api/airports`)
    .then(() => ({ status: 200 }))
    .catch(err => ({ status: err.response?.status }));
  logTest('Missing keyword returns 400', missingParam.status === 400);

  // Test invalid route
  const invalidRoute = await axios.get(`${FRONTEND_URL}/api/invalid`)
    .then(() => ({ status: 200 }))
    .catch(err => ({ status: err.response?.status }));
  logTest('Invalid route returns 404', invalidRoute.status === 404);

  // 6. Backend Direct Tests
  console.log(colors.yellow('\n6. Backend Direct Tests:'));
  
  const backendAirports = await testEndpoint('Backend airport search', `${BACKEND_URL}/api/airports?keyword=NYC`);
  if (backendAirports) {
    logTest('Backend returns nested structure', !!backendAirports.data?.airports);
  }

  // Summary
  console.log(colors.gray('\n' + '=' .repeat(50)));
  console.log(colors.cyan('\n📊 TEST SUMMARY:\n'));
  console.log(`Total Tests: ${totalTests}`);
  console.log(colors.green(`Passed: ${passedTests}`));
  console.log(colors.red(`Failed: ${failedTests}`));
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log(colors.green('\n✅ ALL TESTS PASSED! The app is working correctly.\n'));
  } else {
    console.log(colors.red(`\n❌ ${failedTests} tests failed. Please check the issues above.\n`));
  }
}

// Run tests
runTests().catch(err => {
  console.error(colors.red('\n❌ Test suite failed to run:'), err.message);
  process.exit(1);
}); 