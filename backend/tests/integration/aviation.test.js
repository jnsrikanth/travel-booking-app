/**
 * Aviation API Integration Tests
 * 
 * Tests for flight search and airport search endpoints including:
 * - Valid flight and airport searches
 * - Parameter validation
 * - Error handling
 * - Response structure validation
 */

const request = require('supertest');
const express = require('express');
const aviationRouter = require('../../src/routes/aviation');
const aviationController = require('../../src/controllers/aviationController');
const aviationStack = require('../../src/services/aviationStack');

// Mock the aviationStack service to avoid actual API calls during tests
jest.mock('../../src/services/aviationStack');

// Create an Express app with the aviation routes for testing
const app = express();
app.use(express.json());
app.use('/api', aviationRouter);

// Sample test data for flight searches
const validFlightParams = {
  originLocationCode: 'JFK',
  destinationLocationCode: 'LAX',
  departureDate: '2025-06-15',
  adults: 2,
  travelClass: 'ECONOMY'
};

// Mock flight response data
const mockFlights = [
  {
    id: 'AA123',
    flightNumber: 'AA123',
    airline: 'American Airlines',
    origin: {
      iataCode: 'JFK',
      name: 'John F Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      terminal: '8',
      gate: 'B12'
    },
    destination: {
      iataCode: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      terminal: '4',
      gate: 'C45'
    },
    departureDate: '2025-06-15',
    departureTime: '08:30',
    arrivalDate: '2025-06-15',
    arrivalTime: '11:45',
    duration: '6h 15m',
    status: 'scheduled',
    aircraft: 'B738',
    delay: {
      departure: null,
      arrival: null
    }
  },
  {
    id: 'DL456',
    flightNumber: 'DL456',
    airline: 'Delta Air Lines',
    origin: {
      iataCode: 'JFK',
      name: 'John F Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      terminal: '4',
      gate: 'D8'
    },
    destination: {
      iataCode: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      terminal: '2',
      gate: 'A22'
    },
    departureDate: '2025-06-15',
    departureTime: '10:15',
    arrivalDate: '2025-06-15',
    arrivalTime: '13:25',
    duration: '6h 10m',
    status: 'scheduled',
    aircraft: 'A321',
    delay: {
      departure: null,
      arrival: null
    }
  }
];

// Mock airport response data
const mockAirports = [
  {
    iataCode: 'JFK',
    name: 'John F Kennedy International Airport',
    city: 'New York',
    country: 'United States'
  },
  {
    iataCode: 'LGA',
    name: 'LaGuardia Airport',
    city: 'New York',
    country: 'United States'
  },
  {
    iataCode: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'Newark',
    country: 'United States'
  }
];

// Helper function to check if a flight has valid structure
const hasValidFlightStructure = (flight) => {
  return (
    typeof flight.id === 'string' &&
    typeof flight.flightNumber === 'string' &&
    typeof flight.airline === 'string' &&
    typeof flight.origin === 'object' &&
    typeof flight.origin.iataCode === 'string' &&
    typeof flight.origin.name === 'string' &&
    typeof flight.destination === 'object' &&
    typeof flight.destination.iataCode === 'string' &&
    typeof flight.destination.name === 'string' &&
    typeof flight.departureDate === 'string' &&
    typeof flight.departureTime === 'string' &&
    typeof flight.arrivalDate === 'string' &&
    typeof flight.arrivalTime === 'string'
  );
};

describe('Aviation API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  describe('Flight Search Endpoint - Success Cases', () => {
    test('should successfully search flights with valid parameters', async () => {
      // Mock the aviationStack.searchFlights to return successful response
      aviationStack.searchFlights.mockResolvedValue({
        flights: mockFlights,
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
        .query(validFlightParams);

      // Verify response status and structure
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flights');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.flights).toHaveLength(2);
      expect(response.body.metadata.count).toBe(2);
      
      // Verify that the API was called with the right parameters
      expect(aviationStack.searchFlights).toHaveBeenCalledWith({
        originLocationCode: 'JFK',
        destinationLocationCode: 'LAX',
        departureDate: '2025-06-15',
        adults: 2,
        travelClass: 'ECONOMY'
      });

      // Verify flight data structure for each flight
      response.body.flights.forEach(flight => {
        expect(hasValidFlightStructure(flight)).toBe(true);
      });
    });

    test('should return empty flights array with context when no flights found', async () => {
      // Mock aviationStack to return empty flights
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          limit: 100,
          offset: 0,
          count: 0,
          source: 'AviationStack API'
        },
        emptyResultContext: {
          possibleReasons: ["No scheduled flights exist for this route on the specified date"],
          suggestions: ["Try a different date"]
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flights');
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata.count).toBe(0);
      expect(response.body.metadata).toHaveProperty('possibleReasons');
      expect(response.body.metadata).toHaveProperty('message');
    });
  });

  describe('Flight Search Endpoint - Validation & Error Cases', () => {
    test('should return 400 for missing required parameters', async () => {
      // Missing originLocationCode
      const invalidParams = {
        destinationLocationCode: 'LAX',
        departureDate: '2025-06-15'
      };

      const response = await request(app)
        .get('/api/flights')
        .query(invalidParams);

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required parameters');
    });

    test('should return 400 for invalid date format', async () => {
      // Invalid date format
      const invalidDateParams = {
        ...validFlightParams,
        departureDate: '15/06/2025' // Not YYYY-MM-DD
      };

      const response = await request(app)
        .get('/api/flights')
        .query(invalidDateParams);

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('error');
      expect(response.body.metadata.error).toContain('Date validation failed');
    });

    test('should return 500 when AviationStack API returns an error', async () => {
      // Mock API error
      aviationStack.searchFlights.mockRejectedValue(new Error('Failed to retrieve flight data'));

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to search flights');
    });

    test('should handle rate limit errors gracefully', async () => {
      // Mock a rate limit error
      aviationStack.searchFlights.mockRejectedValue(
        new Error('Rate limit reached. Please try again in 60 seconds.')
      );

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Rate limit');
    });
  });

  describe('Flight Search Response Structure Validation', () => {
    test('should include all required fields in the response', async () => {
      // Mock successful response
      aviationStack.searchFlights.mockResolvedValue({
        flights: mockFlights,
        apiResponse: {
          total: 2,
          limit: 100,
          offset: 0,
          count: 2,
          source: 'AviationStack API',
          timestamp: new Date().toISOString()
        },
        dateValidation: {
          valid: true,
          message: 'Date is within valid range'
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify top-level structure
      expect(response.body).toHaveProperty('flights');
      expect(response.body).toHaveProperty('metadata');
      
      // Verify metadata fields
      expect(response.body.metadata).toHaveProperty('count');
      expect(response.body.metadata).toHaveProperty('requestInfo');
      expect(response.body.metadata).toHaveProperty('dateValidation');
      
      // Verify request info fields
      expect(response.body.metadata.requestInfo).toHaveProperty('origin');
      expect(response.body.metadata.requestInfo).toHaveProperty('destination');
      expect(response.body.metadata.requestInfo).toHaveProperty('date');
      expect(response.body.metadata.requestInfo).toHaveProperty('class');

      // Verify flight fields
      response.body.flights.forEach(flight => {
        expect(flight).toHaveProperty('id');
        expect(flight).toHaveProperty('flightNumber');
        expect(flight).toHaveProperty('airline');
        expect(flight).toHaveProperty('origin');
        expect(flight.origin).toHaveProperty('iataCode');
        expect(flight.origin).toHaveProperty('name');
        expect(flight.origin).toHaveProperty('city');
        expect(flight.origin).toHaveProperty('country');
        expect(flight).toHaveProperty('destination');
        expect(flight.destination).toHaveProperty('iataCode');
        expect(flight.destination).toHaveProperty('name');
        expect(flight.destination).toHaveProperty('city');
        expect(flight.destination).toHaveProperty('country');
        expect(flight).toHaveProperty('departureDate');
        expect(flight).toHaveProperty('departureTime');
        expect(flight).toHaveProperty('arrivalDate');
        expect(flight).toHaveProperty('arrivalTime');
        expect(flight).toHaveProperty('duration');
        expect(flight).toHaveProperty('status');
      });
    });
  });

  describe('Airport Search Endpoint', () => {
    test('should successfully search airports by keyword', async () => {
      // Mock the searchAirports method to return successful response
      aviationStack.searchAirports.mockResolvedValue(mockAirports);

      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'New York' });

      // Verify response
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      
      // Verify airport structure
      const airport = response.body[0];
      expect(airport).toHaveProperty('iataCode');
      expect(airport).toHaveProperty('name');
      expect(airport).toHaveProperty('city');
      expect(airport).toHaveProperty('country');
    });

    test('should return 400 when keyword is too short', async () => {
      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'a' }); // Too short

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must be at least 2 characters');
    });

    test('should return 500 when AviationStack API returns an error', async () => {
      // Mock API error
      aviationStack.searchAirports.mockRejectedValue(new Error('Failed to search airports'));

      const response = await request(app)
        .get('/api/airports')
        .query({ keyword: 'New York' });

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AviationStack API error');
    });
  });

  describe('Date Validation Tests', () => {
    test('should validate that flight date is not in the past', async () => {
      // Use a past date
      const pastDateParams = {
        ...validFlightParams,
        departureDate: '2020-01-01'
      };

      // Create a mock response that simulates the date validation
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          count: 0
        },
        dateValidation: {
          valid: false,
          message: 'The requested date is in the past. Please select a current or future date.'
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query(pastDateParams);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata).toHaveProperty('dateValidation');
      expect(response.body.metadata.dateValidation.valid).toBe(false);
      expect(response.body.metadata.dateValidation.message).toContain('in the past');
    });

    test('should validate that flight date is not too far in the future', async () => {
      // Use a date far in the future
      const farFutureParams = {
        ...validFlightParams,
        departureDate: '2030-01-01'
      };

      // Create a mock response that simulates the date validation
      aviationStack.searchFlights.mockResolvedValue({
        flights: [],
        apiResponse: {
          total: 0,
          count: 0
        },
        dateValidation: {
          valid: false,
          message: 'The requested date is too far in the future. Most airlines only schedule flights up to 11 months in advance.'
        }
      });

      const response = await request(app)
        .get('/api/flights')
        .query(farFutureParams);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.flights).toHaveLength(0);
      expect(response.body.metadata).toHaveProperty('dateValidation');
      expect(response.body.metadata.dateValidation.valid).toBe(false);
      expect(response.body.metadata.dateValidation.message).toContain('too far in the future');
    });
  });

  describe('Edge Cases', () => {
    test('should handle API key configuration issues', async () => {
      // Mock API key error
      aviationStack.searchFlights.mockRejectedValue(
        new Error('AviationStack API key is required')
      );

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('API key');
    });

    test('should handle network errors gracefully', async () => {
      // Mock network error
      aviationStack.searchFlights.mockRejectedValue(
        new Error('Network Error')
      );

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Network Error');
    });

    test('should handle empty API responses gracefully', async () => {
      // Mock empty response
      aviationStack.searchFlights.mockResolvedValue({});

      const response = await request(app)
        .get('/api/flights')
        .query(validFlightParams);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flights');
      expect(Array.isArray(response.body.flights)).toBe(true);
      expect(response.body.flights).toHaveLength(0);
    });
  });
});

