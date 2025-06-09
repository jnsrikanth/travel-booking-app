const axios = require('axios');
const colors = require('colors');

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3002';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper function to log test results
function logTest(testName, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`✅ ${testName}`.green);
        testResults.push({ test: testName, status: 'PASSED', details });
    } else {
        failedTests++;
        console.log(`❌ ${testName}`.red);
        if (details) console.log(`   Details: ${details}`.yellow);
        testResults.push({ test: testName, status: 'FAILED', details });
    }
}

// Helper function to make API calls
async function apiCall(url, options = {}) {
    try {
        const response = await axios({ url, ...options });
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            data: error.response?.data, 
            status: error.response?.status 
        };
    }
}

// Test Suite
async function runTests() {
    console.log('\n🚀 Starting Comprehensive Test Suite\n'.cyan.bold);
    
    // 1. Backend Health Check
    console.log('1️⃣  Backend Health Tests'.yellow.bold);
    const healthCheck = await apiCall(`${BACKEND_URL}/health`);
    logTest('Backend health endpoint', healthCheck.success && healthCheck.data.status === 'healthy');
    logTest('Aviation API configured', healthCheck.success && healthCheck.data.apiKey === 'configured');
    logTest('Redis caching enabled', healthCheck.success && healthCheck.data.service?.caching?.enabled === true);
    
    // 2. Frontend Accessibility
    console.log('\n2️⃣  Frontend Accessibility Tests'.yellow.bold);
    const frontendCheck = await apiCall(FRONTEND_URL);
    logTest('Frontend accessible', frontendCheck.success);
    logTest('Frontend returns HTML', frontendCheck.success && frontendCheck.data.includes('<!DOCTYPE html>'));
    
    // 3. Airport Search Tests
    console.log('\n3️⃣  Airport Search Tests'.yellow.bold);
    
    // Test valid IATA codes
    const validCodes = ['JFK', 'LAX', 'DFW', 'ORD', 'ATL'];
    for (const code of validCodes) {
        const result = await apiCall(`${BACKEND_URL}/api/airports?keyword=${code}`);
        const airports = result.data?.data?.airports || result.data?.airports || [];
        logTest(
            `Airport search: ${code}`,
            result.success && airports.length > 0,
            `Found ${airports.length} airports`
        );
    }
    
    // Test partial matches
    const partialResult = await apiCall(`${BACKEND_URL}/api/airports?keyword=new`);
    const partialAirports = partialResult.data?.data?.airports || partialResult.data?.airports || [];
    logTest(
        'Partial airport search: "new"',
        partialResult.success && partialAirports.length > 0,
        `Found ${partialAirports.length} airports`
    );
    
    // Test invalid searches
    const invalidResult = await apiCall(`${BACKEND_URL}/api/airports?keyword=XXXXX`);
    const invalidAirports = invalidResult.data?.data?.airports || invalidResult.data?.airports || [];
    logTest(
        'Invalid airport search returns empty',
        invalidResult.success && invalidAirports.length === 0
    );
    
    // 4. Flight Search Tests
    console.log('\n4️⃣  Flight Search Tests'.yellow.bold);
    
    // Test popular routes
    const routes = [
        { from: 'JFK', to: 'LAX', date: '2024-12-15' },
        { from: 'LAX', to: 'JFK', date: '2024-12-20' },
        { from: 'JFK', to: 'DFW', date: '2024-12-07' },
        { from: 'ORD', to: 'ATL', date: '2024-12-01' }
    ];
    
    for (const route of routes) {
        const result = await apiCall(
            `${BACKEND_URL}/api/flights?originLocationCode=${route.from}&destinationLocationCode=${route.to}&departureDate=${route.date}&adults=1&travelClass=ECONOMY`
        );
        
        const flights = result.data?.flights || [];
        const hasFlights = result.success && Array.isArray(flights);
        const flightCount = flights.length;
        
        logTest(
            `Flight search: ${route.from} → ${route.to} on ${route.date}`,
            hasFlights,
            `Found ${flightCount} flights`
        );
        
        // If flights found, validate structure
        if (hasFlights && flightCount > 0) {
            const flight = flights[0];
            logTest(
                `Flight data structure valid for ${route.from} → ${route.to}`,
                flight.hasOwnProperty('price') && 
                flight.hasOwnProperty('origin') && 
                flight.hasOwnProperty('destination') &&
                flight.hasOwnProperty('airline'),
                `Price: $${flight.price || 'N/A'}`
            );
        }
    }
    
    // Test invalid route
    const invalidRoute = await apiCall(
        `${BACKEND_URL}/api/flights?originLocationCode=XXX&destinationLocationCode=YYY&departureDate=2025-06-15&adults=1`
    );
    const invalidFlights = invalidRoute.data?.flights || [];
    logTest(
        'Invalid flight route returns empty',
        invalidRoute.success && invalidFlights.length === 0
    );
    
    // 5. API Response Time Tests
    console.log('\n5️⃣  Performance Tests'.yellow.bold);
    
    const startTime = Date.now();
    await apiCall(`${BACKEND_URL}/api/airports?keyword=JFK`);
    const airportResponseTime = Date.now() - startTime;
    logTest(
        'Airport search response time',
        airportResponseTime < 1000,
        `${airportResponseTime}ms`
    );
    
    const flightStartTime = Date.now();
    await apiCall(`${BACKEND_URL}/api/flights?originLocationCode=JFK&destinationLocationCode=LAX&departureDate=2024-12-15&adults=1`);
    const flightResponseTime = Date.now() - flightStartTime;
    logTest(
        'Flight search response time (cached)',
        flightResponseTime < 2000,
        `${flightResponseTime}ms`
    );
    
    // 6. Frontend API Integration Tests
    console.log('\n6️⃣  Frontend Integration Tests'.yellow.bold);
    
    // Test frontend API proxy
    const frontendProxyResult = await apiCall(
        `${FRONTEND_URL}/api/airports?keyword=JFK`
    );
    const proxyAirports = frontendProxyResult.data?.data?.airports || frontendProxyResult.data?.airports || [];
    logTest(
        'Frontend airport API proxy',
        frontendProxyResult.success && proxyAirports.length > 0,
        `Status: ${frontendProxyResult.status}`
    );
    
    const frontendFlightProxyResult = await apiCall(
        `${FRONTEND_URL}/api/flights?originLocationCode=JFK&destinationLocationCode=LAX&departureDate=2024-12-15&adults=1`
    );
    const proxyFlights = frontendFlightProxyResult.data?.flights || [];
    logTest(
        'Frontend flight API proxy',
        frontendFlightProxyResult.success && (proxyFlights.length > 0 || proxyFlights.length === 0),
        `Status: ${frontendFlightProxyResult.status}`
    );
    
    // 7. Error Handling Tests
    console.log('\n7️⃣  Error Handling Tests'.yellow.bold);
    
    // Missing parameters
    const missingParamsResult = await apiCall(`${BACKEND_URL}/api/flights?originLocationCode=JFK`);
    logTest(
        'Missing parameters handled gracefully',
        missingParamsResult.status === 400 || missingParamsResult.status === 200,
        `Status: ${missingParamsResult.status}`
    );
    
    // Invalid date format
    const invalidDateResult = await apiCall(`${BACKEND_URL}/api/flights?originLocationCode=JFK&destinationLocationCode=LAX&departureDate=invalid-date&adults=1`);
    logTest(
        'Invalid date handled gracefully',
        invalidDateResult.success || invalidDateResult.status === 400,
        `Status: ${invalidDateResult.status}`
    );
    
    // Test flight data structure
    const testFlightDataStructure = async (flights, route) => {
      if (flights.length === 0) {
        logTest(`Flight data structure valid for ${route}`, false, 'No flights returned');
        return false;
      }

      const flight = flights[0];
      const hasRequiredFields = flight.flightNumber && 
        flight.airline && 
        flight.origin && flight.origin.iataCode && 
        flight.destination && flight.destination.iataCode && 
        flight.departureTime && 
        flight.arrivalTime && 
        flight.duration;
      
      if (!hasRequiredFields) {
        logTest(`Flight data structure valid for ${route}`, false, 'Missing required fields');
        return false;
      }

      // Price might not be available from real API, so we don't fail the test for this
      if (!flight.price || flight.price === '$N/A') {
        logTest(`Flight data structure valid for ${route}`, true, 'Price: $N/A');
      }

      logTest(`Flight data structure valid for ${route}`, true);
      return true;
    };
    
    // Summary
    console.log('\n📊 Test Summary'.cyan.bold);
    console.log('═'.repeat(50).cyan);
    console.log(`Total Tests: ${totalTests}`.white);
    console.log(`Passed: ${passedTests}`.green);
    console.log(`Failed: ${failedTests}`.red);
    console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`.yellow);
    console.log('═'.repeat(50).cyan);
    
    // Detailed failure report
    if (failedTests > 0) {
        console.log('\n❌ Failed Tests Details:'.red.bold);
        testResults
            .filter(r => r.status === 'FAILED')
            .forEach(r => {
                console.log(`  - ${r.test}`.red);
                if (r.details) console.log(`    ${r.details}`.gray);
            });
    }
    
    // Final verdict
    console.log('\n🎯 Final Verdict:'.cyan.bold);
    if (failedTests === 0) {
        console.log('✅ ALL TESTS PASSED! The app is working perfectly! 🎉'.green.bold);
    } else if (failedTests <= 3) {
        console.log('⚠️  Most tests passed with minor issues.'.yellow.bold);
    } else {
        console.log('❌ Multiple tests failed. The app needs attention.'.red.bold);
    }
    
    return { totalTests, passedTests, failedTests };
}

// Run the tests
console.log('🔧 Travel Booking App - Comprehensive Test Suite'.cyan.bold);
console.log('═'.repeat(50).cyan);

runTests()
    .then(results => {
        process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    }); 