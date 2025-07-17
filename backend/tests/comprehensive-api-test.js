#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TIMEOUT = 15000; // 15 seconds
const RESULTS_FILE = 'test-results.json';

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  log(`${icon} ${testName}: ${status} ${details}`);
}

async function runTest(testName, testFunction) {
  const startTime = Date.now();
  try {
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    testResults.tests.push({
      name: testName,
      status: 'PASS',
      duration,
      result,
      timestamp: new Date().toISOString()
    });
    
    testResults.summary.passed++;
    logTest(testName, 'PASS', `(${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.tests.push({
      name: testName,
      status: 'FAIL',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    testResults.summary.failed++;
    logTest(testName, 'FAIL', `(${duration}ms) - ${error.message}`);
    throw error;
  }
}

// Test functions
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: TIMEOUT });
  if (response.status !== 200) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.data;
}

async function testAirportSearch() {
  const response = await axios.get(`${BASE_URL}/api/airports`, {
    params: { keyword: 'DFW' },
    timeout: TIMEOUT
  });
  
  if (response.status !== 200) {
    throw new Error(`Airport search failed with status ${response.status}`);
  }
  
  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error('Airport search returned no results');
  }
  
  return {
    count: response.data.length,
    sample: response.data[0]
  };
}

async function testFutureFlightSearch() {
  const response = await axios.get(`${BASE_URL}/api/flights`, {
    params: {
      originLocationCode: 'DFW',
      destinationLocationCode: 'JFK',
      departureDate: '2025-07-28',
      adults: 1,
      travelClass: 'ECONOMY'
    },
    timeout: TIMEOUT
  });
  
  if (response.status !== 200) {
    throw new Error(`Flight search failed with status ${response.status}`);
  }
  
  const data = response.data;
  if (!data.flights || !Array.isArray(data.flights)) {
    throw new Error('Flight search returned invalid data structure');
  }
  
  return {
    source: data.apiResponse?.source || 'Unknown',
    flightCount: data.flights.length,
    isRealData: data.flights[0]?.isRealData || false,
    sampleFlight: data.flights[0] ? {
      airline: data.flights[0].airline,
      flightNumber: data.flights[0].flightNumber,
      price: data.flights[0].price,
      departure: data.flights[0].departureTime,
      arrival: data.flights[0].arrivalTime
    } : null
  };
}

async function testRateLimiting() {
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}/api/flights`, {
        params: {
          originLocationCode: 'LAX',
          destinationLocationCode: 'ORD',
          departureDate: '2025-07-28',
          adults: 1,
          travelClass: 'ECONOMY'
        },
        timeout: TIMEOUT
      });
      
      const duration = Date.now() - startTime;
      results.push({
        call: i + 1,
        status: 'success',
        duration,
        source: response.data.apiResponse?.source || 'Unknown',
        flightCount: response.data.flights?.length || 0
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        call: i + 1,
        status: 'error',
        duration,
        error: error.message
      });
    }
    
    // Wait 2 seconds between calls
    if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

async function testDifferentRoutes() {
  const routes = [
    { from: 'SFO', to: 'BOS', name: 'San Francisco to Boston' },
    { from: 'MIA', to: 'SEA', name: 'Miami to Seattle' },
    { from: 'ATL', to: 'DFW', name: 'Atlanta to Dallas' }
  ];
  
  const results = [];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${BASE_URL}/api/flights`, {
        params: {
          originLocationCode: route.from,
          destinationLocationCode: route.to,
          departureDate: '2025-07-28',
          adults: 1,
          travelClass: 'ECONOMY'
        },
        timeout: TIMEOUT
      });
      
      results.push({
        route: route.name,
        status: 'success',
        source: response.data.apiResponse?.source || 'Unknown',
        flightCount: response.data.flights?.length || 0
      });
      
    } catch (error) {
      results.push({
        route: route.name,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
}

// Main test execution
async function runAllTests() {
  const overallStartTime = Date.now();
  
  log('🚀 Starting comprehensive API tests...');
  log(`Target URL: ${BASE_URL}`);
  log('=====================================');
  
  try {
    // Test 1: Health Check
    await runTest('Health Check', testHealthCheck);
    
    // Test 2: Airport Search
    await runTest('Airport Search', testAirportSearch);
    
    // Test 3: Future Flight Search
    await runTest('Future Flight Search', testFutureFlightSearch);
    
    // Test 4: Rate Limiting
    await runTest('Rate Limiting (3 calls)', testRateLimiting);
    
    // Test 5: Different Routes
    await runTest('Different Routes', testDifferentRoutes);
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'ERROR');
  }
  
  // Calculate summary
  testResults.summary.total = testResults.tests.length;
  testResults.summary.duration = Date.now() - overallStartTime;
  
  // Print summary
  log('=====================================');
  log(`📊 Test Summary:`);
  log(`   Total Tests: ${testResults.summary.total}`);
  log(`   Passed: ${testResults.summary.passed}`);
  log(`   Failed: ${testResults.summary.failed}`);
  log(`   Duration: ${testResults.summary.duration}ms`);
  log(`   Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  // Save results to file
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
  log(`📁 Results saved to ${RESULTS_FILE}`);
  
  // Exit with error code if any tests failed
  if (testResults.summary.failed > 0) {
    process.exit(1);
  }
  
  log('✅ All tests completed successfully!');
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { runAllTests };
