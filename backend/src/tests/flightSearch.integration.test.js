/**
 * Flight Search Integration Test
 * 
 * This test suite focuses on testing the flight search functionality including:
 * 1. Complete flight search flow
 * 2. API response handling
 * 3. Error scenarios
 * 4. Response structure verification
 * 5. Form data validation
 * 
 * Uses Jest and Supertest for API testing with mocked AviationStack API responses.
 */

const request = require('supertest');
const express = require('express');
const app = express();
const aviationRoutes = require('../routes/aviation');
const aviationStack = require('../services/aviationStack');

// Mock the aviationStack service
jest.mock('../services/aviationStack');

// Sample mock data
const MOCK_FLIGHTS = [
  {
    id: 'BA123',
    flightNumber: 'BA123',
    airline: 'British Airways',
    origin: {
      iataCode: 'LHR',
      name: 'Heathrow Airport',
      city: 'London',
      country: 'United Kingdom',
      terminal: '5',
      gate: 'A22'
    },
    destination: {
      iataCode: 'JFK',
      name: 'John F Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      terminal: '8',
      gate: 'B12'
    },
    departureDate: '2025-06-15',
    departureTime: '09:30',
    arrivalDate: '2025-06-15',
    arrivalTime: '12:45',
    duration: '7h 15m',
    status: 'scheduled',
    aircraft: 'B777',
    delay: {
      departure: null,
      arrival: null
    }
  },
  {
    id: 'AA456',
    flightNumber: 'AA456',
    airline: 'American Airlines',
    origin: {
      iataCode: 'LHR',
      name: 'Heathrow Airport',
      city: 'London',
      country: 'United Kingdom',
      terminal: '3',
      gate: 'C10'
    },
    destination: {
      iataCode: 'JFK',
      name: 'John F Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      terminal: '8',
      gate: 'D5'
    },
    departureDate: '2025-06-15',
    departureTime: '14:15',
    arrivalDate: '2025-06-15',
    arrivalTime: '17:30',
    duration: '7h 15m',
    status: 'scheduled',
    aircraft: 'B787',
    delay: {
      departure: null,
      arrival: null
    }
  }
];

const MOCK_AIRPORTS = [
  {
    iataCode: 'LHR',
    name: 'Heathrow Airport',
    city: 'London',
    country: 'United Kingdom'
  },
  {
    iataCode: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States'
  }
];

// Configure the Express app
app.use('/api', aviationRoutes);

// Configure error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

describe('Flight Search API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Complete Flight Search Flow', () => {
    test('should successfully search for flights with valid parameters', async () => {
      // Mock the searchFlights method to return successful results
      aviationStack.searchFlights.mockResolvedValue({
        flights: MOCK_FLIGHTS,
        apiResponse: {
          total: 2,
          limit: 100,
          offset: 0,
          count: 2,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15',
          adults: 1,
          travelClass: 'ECONOMY'
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flights');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.flights).toHaveLength(2);
      expect(response.body.metadata.count).toBe(2);
      
      // Verify the API was called with correct parameters
      expect(aviationStack.searchFlights).toHaveBeenCalledWith({
        originLocationCode: 'LHR',
        destinationLocationCode: 'JFK',
        departureDate: '2025-06-15',
        returnDate: undefined,
        adults: 1,
        travelClass: 'ECONOMY'
      });
    });

    test('should return properly structured flight data', async () => {
      aviationStack.searchFlights.mockResolvedValue({
        flights: MOCK_FLIGHTS,
        apiResponse: {
          total: 2,
          limit: 100,
          offset: 0,
          count: 2,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      // Verify the structure of the flight data
      const flight = response.body.flights[0];
      expect(flight).toHaveProperty('id');
      expect(flight).toHaveProperty('airline');
      expect(flight).toHaveProperty('flightNumber');
      expect(flight).toHaveProperty('origin');
      expect(flight).toHaveProperty('destination');
      expect(flight).toHaveProperty('departureDate');
      expect(flight).toHaveProperty('departureTime');
      expect(flight).toHaveProperty('arrivalDate');
      expect(flight).toHaveProperty('arrivalTime');
      expect(flight).toHaveProperty('duration');
      expect(flight).toHaveProperty('status');
      
      // Verify origin and destination structure
      expect(flight.origin).toHaveProperty('iataCode');
      expect(flight.origin).toHaveProperty('name');
      expect(flight.origin).toHaveProperty('city');
      expect(flight.origin).toHaveProperty('country');
      
      expect(flight.destination).toHaveProperty('iataCode');
      expect(flight.destination).toHaveProperty('name');
      expect(flight.destination).toHaveProperty('city');
      expect(flight.destination).toHaveProperty('country');
    });
  });

  describe('API Response Handling', () => {
    test('should handle empty flight results correctly', async () => {
      // Mock empty flight results
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          limit: 100,
          offset: 0,
          count: 0,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        },
        emptyResultContext: {
          possibleReasons: ["No scheduled flights exist for this route on the specified date"],
          suggestions: ["Try a different date"]
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flights');
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata).toHaveProperty('count', 0);
      expect(response.body.metadata).toHaveProperty('message');
      expect(response.body.metadata).toHaveProperty('possibleReasons');
    });

    test('should return enhanced metadata with flight results', async () => {
      aviationStack.searchFlights.mockResolvedValue({
        flights: MOCK_FLIGHTS,
        apiResponse: {
          total: 2,
          limit: 100,
          offset: 0,
          count: 2,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        },
        dateValidation: {
          date: '2025-06-15',
          status: 'valid',
          message: 'Date is within valid range',
          dateCategory: 'future'
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      // Verify metadata structure
      expect(response.body.metadata).toHaveProperty('count');
      expect(response.body.metadata).toHaveProperty('requestInfo');
      expect(response.body.metadata.requestInfo).toHaveProperty('origin', 'LHR');
      expect(response.body.metadata.requestInfo).toHaveProperty('destination', 'JFK');
      expect(response.body.metadata.requestInfo).toHaveProperty('date', '2025-06-15');
    });
  });

  describe('Error Scenarios', () => {
    test('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/api/flights')
        .query({
          // Missing originLocationCode
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required parameters');
    });

    test('should handle API errors gracefully', async () => {
      // Mock API error
      aviationStack.searchFlights.mockRejectedValue(new Error('API connection error'));

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to search flights');
    });

    test('should handle rate limit errors with specific message', async () => {
      // Mock rate limit error
      const rateLimitError = new Error('Rate limit reached');
      rateLimitError.response = {
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
      };
      
      aviationStack.searchFlights.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to search flights');
    });
  });

  describe('Response Structure Verification', () => {
    test('should include all required fields in the response', async () => {
      aviationStack.searchFlights.mockResolvedValue({
        flights: MOCK_FLIGHTS,
        apiResponse: {
          total: 2,
          limit: 100,
          offset: 0,
          count: 2,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      // Verify top-level structure
      expect(response.body).toHaveProperty('flights');
      expect(response.body).toHaveProperty('metadata');
      
      // Verify metadata fields
      expect(response.body.metadata).toHaveProperty('count');
      expect(response.body.metadata).toHaveProperty('requestInfo');
      
      // Verify request info fields
      expect(response.body.metadata.requestInfo).toHaveProperty('origin');
      expect(response.body.metadata.requestInfo).toHaveProperty('destination');
      expect(response.body.metadata.requestInfo).toHaveProperty('date');
      expect(response.body.metadata.requestInfo).toHaveProperty('class');
    });
  });

  describe('Form Data Validation', () => {
    test('should validate departure date is not in the past', async () => {
      // Set a past date
      const pastDate = '2020-01-01';
      
      // Mock the date validation response
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        metadata: {
          count: 0,
          requestInfo: {
            origin: 'LHR',
            destination: 'JFK',
            date: pastDate,
            class: 'ECONOMY'
          },
          dateValidation: {
            valid: false,
            message: "The requested date is in the past. Please select a current or future date."
          },
          error: "Date validation failed",
          message: "The requested date is in the past. Please select a current or future date."
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: pastDate
        });

      expect(response.status).toBe(200);
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata).toHaveProperty('dateValidation');
      expect(response.body.metadata.dateValidation).toHaveProperty('valid', false);
    });

    test('should validate airport codes are valid', async () => {
      // Test with airport search first
      aviationStack.searchAirports.mockResolvedValue(MOCK_AIRPORTS);
      
      const airportResponse = await request(app)
        .get('/api/airports')
        .query({ keyword: 'London' });
        
      expect(airportResponse.status).toBe(200);
      expect(airportResponse.body).toContainEqual(expect.objectContaining({
        iataCode: 'LHR',
        name: 'Heathrow Airport'
      }));
      
      // Then test with an invalid airport code
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          limit: 100,
          offset: 0,
          count: 0,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        },
        emptyResultContext: {
          possibleReasons: ["Airport code XYZ not found"]
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'XYZ', // Invalid code
          destinationLocationCode: 'JFK',
          departureDate: '2025-06-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.flights).toHaveLength(0);
    });

    test('should validate future flight dates within accepted range', async () => {
      // Set a date too far in the future
      const farFutureDate = '2027-01-01';
      
      // Mock validation response for future date
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          limit: 0,
          offset: 0,
          count: 0
        },
        dateValidation: {
          valid: false,
          message: "The requested date is too far in the future. Most airlines only schedule flights up to 11 months in advance."
        },
        emptyResultContext: {
          possibleReasons: ["The requested date is too far in the future"],
          suggestions: ["Try a date within the next 11 months"]
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: farFutureDate
        });

      expect(response.status).toBe(200);
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata).toHaveProperty('dateValidation');
      expect(response.body.metadata.dateValidation).toHaveProperty('valid', false);
      expect(response.body.metadata.dateValidation.message).toContain('too far in the future');
    });
  });

  describe('Airport Search Tests', () => {
    test('should search for airports by keyword', async () => {
      // Mock the searchAirports method
      aviationStack.searchAirports.mockResolvedValue(MOCK_AIRPORTS);

      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'London' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('iataCode', 'LHR');
      expect(response.body[0]).toHaveProperty('name', 'Heathrow Airport');
    });

    test('should validate minimum keyword length', async () => {
      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'a' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must be at least 2 characters');
    });

    test('should handle API errors during airport search', async () => {
      // Mock API error
      aviationStack.searchAirports.mockRejectedValue(new Error('Failed to search airports'));

      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'London' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AviationStack API error');
    });
  });
});

