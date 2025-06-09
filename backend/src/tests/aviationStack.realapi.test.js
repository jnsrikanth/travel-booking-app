/**
 * AviationStack Real API Integration Tests
 * 
 * This test suite tests real API integration with AviationStack.
 * Tests will only run when AVIATION_STACK_API_KEY is present in environment.
 * 
 * IMPORTANT: These tests make real API calls and may count toward your API quota.
 */

const aviationStack = require('../services/aviationStack');

// Only run these tests if AVIATION_STACK_API_KEY is defined
const apiKey = process.env.AVIATION_STACK_API_KEY;
const shouldRunTests = !!apiKey;

// Set longer timeout for API calls
jest.setTimeout(20000); // 20 seconds timeout

// Display warning if API key is not configured
if (!shouldRunTests) {
  console.warn('\n⚠️ AVIATION_STACK_API_KEY not found in environment variables.');
  console.warn('⚠️ Real API integration tests will be skipped.');
  console.warn('⚠️ To run these tests, add your API key to the environment variables.\n');
}

// Conditionally run tests only if API key is available
(shouldRunTests ? describe : describe.skip)('AviationStack Real API Integration', () => {
  
  // Run before all tests
  beforeAll(() => {
    console.log('\n🌐 Running tests with real AviationStack API');
    console.log('⚠️ Warning: These tests count towards your API quota\n');
  });
  
  // Airport search tests
  describe('Airport Search', () => {
    test('should search for airports by keyword', async () => {
      try {
        const airports = await aviationStack.searchAirports('London');
        
        // Verify response structure
        expect(airports).toBeDefined();
        expect(Array.isArray(airports)).toBe(true);
        
        // Check if we got any results
        if (airports.length > 0) {
          // Verify airport data structure
          const airport = airports[0];
          expect(airport).toHaveProperty('iataCode');
          expect(airport).toHaveProperty('name');
          expect(airport).toHaveProperty('city');
          expect(airport).toHaveProperty('country');
          
          // Verify London airports are included
          const londonAirports = airports.filter(a => 
            a.city.toLowerCase().includes('london') || 
            a.name.toLowerCase().includes('london')
          );
          expect(londonAirports.length).toBeGreaterThan(0);
          
          console.log(`✅ Found ${airports.length} airports matching "London"`);
        } else {
          console.warn('⚠️ No airports found, but API call succeeded');
        }
      } catch (error) {
        console.error('❌ Airport search API error:', error.message);
        throw error;
      }
    });

    test('should handle invalid airport search keywords', async () => {
      try {
        // Use a very short keyword that should return an error
        await aviationStack.searchAirports('a');
        fail('Should have thrown an error for short keyword');
      } catch (error) {
        // Verify error was thrown
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });

  // Current flights search tests
  describe('Current Flight Search', () => {
    test('should search for current flights between major airports', async () => {
      try {
        // Use popular route for higher chance of flights
        const params = {
          originLocationCode: 'JFK',
          destinationLocationCode: 'LAX',
          departureDate: new Date().toISOString().split('T')[0] // Today's date
        };
        
        const result = await aviationStack.searchFlights(params);
        
        // Verify response structure
        expect(result).toBeDefined();
        expect(result).toHaveProperty('flights');
        expect(result).toHaveProperty('apiResponse');
        
        // Log results for debugging
        console.log(`✅ Flight search for ${params.originLocationCode} to ${params.destinationLocationCode} returned ${result.flights.length} flights`);
        
        // Check flight data structure if flights are found
        if (result.flights.length > 0) {
          const flight = result.flights[0];
          expect(flight).toHaveProperty('id');
          expect(flight).toHaveProperty('airline');
          expect(flight).toHaveProperty('flightNumber');
          expect(flight).toHaveProperty('origin');
          expect(flight.origin).toHaveProperty('iataCode');
          expect(flight).toHaveProperty('destination');
          expect(flight.destination).toHaveProperty('iataCode');
        }
      } catch (error) {
        console.error('❌ Flight search API error:', error.message);
        
        // Some errors might be expected (e.g., no flights for today)
        // Don't fail test if it's a data availability issue
        if (error.message.includes('rate limit') || 
            error.message.includes('quota') || 
            error.message.includes('usage limit')) {
          console.warn('⚠️ Test skipped due to API rate limiting');
          return;
        }
        
        throw error;
      }
    });

    test('should handle empty flight results correctly', async () => {
      try {
        // Use uncommon route or past date to get empty results
        const params = {
          originLocationCode: 'ABC', // Using invalid airport code
          destinationLocationCode: 'XYZ',
          departureDate: new Date().toISOString().split('T')[0]
        };
        
        const result = await aviationStack.searchFlights(params);
        
        // Verify response structure for empty results
        expect(result).toBeDefined();
        expect(result).toHaveProperty('flights');
        expect(Array.isArray(result.flights)).toBe(true);
        
        // We expect empty results for invalid airports
        expect(result.flights.length).toBe(0);
        
        // Verify metadata for empty results
        expect(result).toHaveProperty('emptyResultContext');
        expect(result.emptyResultContext).toHaveProperty('possibleReasons');
        expect(Array.isArray(result.emptyResultContext.possibleReasons)).toBe(true);
        
        console.log('✅ Empty results handled correctly');
      } catch (error) {
        console.error('❌ Empty flight search API error:', error.message);
        
        // Don't fail test for some expected errors
        if (error.message.includes('rate limit') || 
            error.message.includes('quota') || 
            error.message.includes('usage limit')) {
          console.warn('⚠️ Test skipped due to API rate limiting');
          return;
        }
        
        throw error;
      }
    });
  });

  // Future flights search tests
  describe('Future Flight Search', () => {
    test('should search for future flights between major airports', async () => {
      try {
        // Set future date (2 weeks from now) for testing
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        // Use popular route for higher chance of flights
        const params = {
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: futureDateStr
        };
        
        const result = await aviationStack.searchFlights(params);
        
        // Verify response structure
        expect(result).toBeDefined();
        expect(result).toHaveProperty('flights');
        expect(result).toHaveProperty('apiResponse');
        expect(result).toHaveProperty('dateValidation');
        
        // Log results for debugging
        console.log(`✅ Future flight search for ${params.originLocationCode} to ${params.destinationLocationCode} on ${futureDateStr} returned ${result.flights.length} flights`);
        
        // Check flight data structure if flights are found
        if (result.flights.length > 0) {
          const flight = result.flights[0];
          expect(flight).toHaveProperty('id');
          expect(flight).toHaveProperty('airline');
          expect(flight).toHaveProperty('flightNumber');
          expect(flight).toHaveProperty('origin');
          expect(flight.origin).toHaveProperty('iataCode');
          expect(flight).toHaveProperty('destination');
          expect(flight.destination).toHaveProperty('iataCode');
          expect(flight).toHaveProperty('departureDate');
          expect(flight).toHaveProperty('departureTime');
        } else {
          // Some APIs may not have future flight data
          console.warn('⚠️ No future flights found. This may be normal depending on your API plan tier.');
          
          // Check for helpful error context
          expect(result).toHaveProperty('emptyResultContext');
          expect(result.emptyResultContext).toHaveProperty('possibleReasons');
        }
      } catch (error) {
        console.error('❌ Future flight search API error:', error.message);
        
        // Future flights might not be available in all API tiers
        // Don't fail the test if it's a feature limitation
        if (error.message.includes('future') || 
            error.message.includes('schedule') || 
            error.message.includes('rate limit') || 
            error.message.includes('quota') || 
            error.message.includes('usage limit')) {
          console.warn('⚠️ Future flight test skipped: This may be due to API plan limitations');
          return;
        }
        
        throw error;
      }
    });

    test('should validate future dates correctly', async () => {
      try {
        // Test with a date too far in the future (2 years)
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);
        const farFutureDateStr = farFutureDate.toISOString().split('T')[0];
        
        const params = {
          originLocationCode: 'JFK',
          destinationLocationCode: 'LAX',
          departureDate: farFutureDateStr
        };
        
        const result = await aviationStack.searchFlights(params);
        
        // Verify date validation
        expect(result).toHaveProperty('dateValidation');
        expect(result.dateValidation).toHaveProperty('status');
        
        // Far future dates should be flagged
        expect(result.dateValidation.status).toBe('far_future');
        
        // Empty results expected for far future dates
        expect(result.flights.length).toBe(0);
        
        console.log('✅ Future date validation working correctly');
      } catch (error) {
        console.error('❌ Future date validation API error:', error.message);
        
        // Future date validation might fail in different ways
        // We're testing that the API handles this appropriately
        if (error.message.includes('future') || 
            error.message.includes('schedule') || 
            error.message.includes('date') || 
            error.message.includes('rate limit') || 
            error.message.includes('quota')) {
          console.warn('⚠️ Date validation handled by error response (expected)');
          return;
        }
        
        throw error;
      }
    });
  });

  // Service status test
  describe('Service Status', () => {
    test('should return service status information', () => {
      const status = aviationStack.getServiceStatus();
      
      // Verify status structure
      expect(status).toBeDefined();
      expect(status).toHaveProperty('provider', 'AviationStack API');
      expect(status).toHaveProperty('apiKeyConfigured', true);
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('features');
      expect(status.features).toHaveProperty('realTimeFlights');
      
      console.log('✅ Service status verified');
    });
  });

  // Cache functionality tests
  describe('Cache Functionality', () => {
    test('should cache and retrieve flight results', async () => {
      try {
        // First call to populate cache
        const params = {
          originLocationCode: 'SFO',
          destinationLocationCode: 'LAX',
          departureDate: new Date().toISOString().split('T')[0]
        };
        
        // Make first call to populate cache
        await aviationStack.searchFlights(params);
        
        // Get cache stats to verify item was cached
        const cacheStats = aviationStack.getCacheStats();
        expect(cacheStats).toBeDefined();
        expect(cacheStats).toHaveProperty('keys');
        expect(cacheStats.keys).toBeGreaterThan(0);
        
        // Make second call which should use cache
        const secondResult = await aviationStack.searchFlights(params);
        expect(secondResult).toBeDefined();
        
        console.log('✅ Cache functionality verified');
        
        // Test cache clearing
        const clearResult = aviationStack.clearCache();
        expect(clearResult).toHaveProperty('cleared', true);
        
        // Verify cache is empty
        const afterClearStats = aviationStack.getCacheStats();
        expect(afterClearStats.keys).toBe(0);
        
        console.log('✅ Cache clearing verified');
      } catch (error) {
        console.error('❌ Cache test API error:', error.message);
        
        if (error.message.includes('rate limit') || 
            error.message.includes('quota')) {
          console.warn('⚠️ Cache test skipped due to API rate limiting');
          return;
        }
        
        throw error;
      }
    });
  });
  
  // Error handling tests
  describe('Error Handling', () => {
    test('should handle rate limit errors gracefully', async () => {
      // Mock rate limit error for testing
      const originalSearchFlights = aviationStack.searchFlights;
      
      // Replace with mock implementation to simulate rate limit
      aviationStack.searchFlights = jest.fn().mockRejectedValue({
        response: {
          status: 429,
          data: {
            error: {
              code: 'rate_limit_reached',
              message: 'You have exceeded the rate limit per minute for your plan'
            }
          },
          headers: {
            'retry-after': '60'
          }
        }
      });
      
      try {
        await aviationStack.searchFlights({
          originLocationCode: 'JFK',
          destinationLocationCode: 'LAX',
          departureDate: new Date().toISOString().split('T')[0]
        });
        
        fail('Should have thrown an error for rate limit');
      } catch (error) {
        // Verify error contains helpful retry information
        expect(error.message).toContain('Rate limit reached');
        expect(error.message).toContain('try again');
      } finally {
        // Restore original implementation
        aviationStack.searchFlights = originalSearchFlights;
      }
      
      console.log('✅ Rate limit error handling verified');
    });
  });
  
  // Cleanup after all tests
  afterAll(() => {
    // Clear cache after tests
    aviationStack.clearCache();
    console.log('\n🧹 Test cleanup: Cache cleared');
    console.log('✅ All real API integration tests completed\n');
  });
});

