import axios from 'axios';
import { searchFlightsWithMetadata } from '@/api/aviation';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the recordFlightSearch function
jest.mock('@/api/aviation', () => ({
  ...jest.requireActual('@/api/aviation'),
  recordFlightSearch: jest.fn().mockResolvedValue(undefined),
}));

describe('Aviation API - searchFlightsWithMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
  });

  it('should correctly handle the backend nested response structure', async () => {
    // This is the EXACT response your backend returns
    const backendResponse = {
      status: 'success',
      data: {
        flights: [
          {
            id: 'AA123',
            airline: { name: 'American Airlines', code: 'AA' },
            departure: { airport: 'JFK', terminal: '4', time: '2025-06-07T10:00:00' },
            arrival: { airport: 'DFW', terminal: 'A', time: '2025-06-07T13:00:00' },
            duration: '3h 0m',
            price: 350,
            seatsAvailable: 25,
            travelClass: 'ECONOMY',
            status: 'scheduled'
          },
          {
            id: 'AA456',
            airline: { name: 'American Airlines', code: 'AA' },
            departure: { airport: 'JFK', terminal: '4', time: '2025-06-07T14:00:00' },
            arrival: { airport: 'DFW', terminal: 'A', time: '2025-06-07T17:00:00' },
            duration: '3h 0m',
            price: 380,
            seatsAvailable: 15,
            travelClass: 'ECONOMY',
            status: 'scheduled'
          }
        ],
        meta: {
          count: 2,
          timestamp: '2025-06-07T08:14:10.826Z',
          source: 'AviationStack API',
          requestInfo: {
            origin: 'JFK',
            destination: 'DFW',
            date: '2025-06-07',
            adults: 1,
            class: 'ECONOMY',
            isFutureSearch: true
          }
        }
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: backendResponse });

    const result = await searchFlightsWithMetadata({
      originLocationCode: 'JFK',
      destinationLocationCode: 'DFW',
      departureDate: '2025-06-07',
      adults: 1,
      travelClass: 'ECONOMY'
    });

    // Verify the API was called correctly
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:4000/api/flights',
      expect.objectContaining({
        params: expect.objectContaining({
          originLocationCode: 'JFK',
          destinationLocationCode: 'DFW',
          departureDate: '2025-06-07',
          adults: 1,
          travelClass: 'ECONOMY',
          isFutureSearch: true
        })
      })
    );

    // Verify the response is transformed correctly
    expect(result).toEqual({
      flights: backendResponse.data.flights,
      metadata: {
        count: 2,
        requestInfo: {
          origin: 'JFK',
          destination: 'DFW',
          date: '2025-06-07',
          class: 'ECONOMY'
        }
      }
    });

    // Most importantly: verify no error is set in metadata
    expect(result.metadata).not.toHaveProperty('error');
  });

  it('should handle responses with only 2 flights without throwing error', async () => {
    const backendResponse = {
      status: 'success',
      data: {
        flights: [
          {
            id: 'AA123',
            airline: { name: 'American Airlines', code: 'AA' },
            departure: { airport: 'JFK', terminal: '4', time: '2025-06-07T10:00:00' },
            arrival: { airport: 'DFW', terminal: 'A', time: '2025-06-07T13:00:00' },
            duration: '3h 0m',
            price: 350,
            seatsAvailable: 25,
            travelClass: 'ECONOMY',
            status: 'scheduled'
          },
          {
            id: 'AA456',
            airline: { name: 'American Airlines', code: 'AA' },
            departure: { airport: 'JFK', terminal: '4', time: '2025-06-07T14:00:00' },
            arrival: { airport: 'DFW', terminal: 'A', time: '2025-06-07T17:00:00' },
            duration: '3h 0m',
            price: 380,
            seatsAvailable: 15,
            travelClass: 'ECONOMY',
            status: 'scheduled'
          }
        ],
        meta: {
          count: 2,
          timestamp: new Date().toISOString(),
          source: 'AviationStack API',
          requestInfo: {
            origin: 'JFK',
            destination: 'DFW',
            date: '2025-06-07',
            adults: 1,
            class: 'ECONOMY',
            isFutureSearch: true
          }
        }
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: backendResponse });

    const result = await searchFlightsWithMetadata({
      originLocationCode: 'JFK',
      destinationLocationCode: 'DFW',
      departureDate: '2025-06-07',
      adults: 1,
      travelClass: 'ECONOMY'
    });

    // Should return 2 flights without any error
    expect(result.flights).toHaveLength(2);
    expect(result.metadata.count).toBe(2);
    expect(result.metadata).not.toHaveProperty('error');
    
    // Should NOT log "Unexpected API response format"
    const consoleErrorSpy = jest.spyOn(console, 'error');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Unexpected API response format'),
      expect.anything()
    );
  });

  it('should handle empty flights array without error', async () => {
    const backendResponse = {
      status: 'success',
      data: {
        flights: [],
        meta: {
          count: 0,
          timestamp: new Date().toISOString(),
          source: 'AviationStack API',
          requestInfo: {
            origin: 'XXX',
            destination: 'YYY',
            date: '2025-06-07',
            adults: 1,
            class: 'ECONOMY',
            isFutureSearch: false
          }
        }
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: backendResponse });

    const result = await searchFlightsWithMetadata({
      originLocationCode: 'XXX',
      destinationLocationCode: 'YYY',
      departureDate: '2025-06-07',
      adults: 1,
      travelClass: 'ECONOMY'
    });

    // Should return empty array without error
    expect(result.flights).toHaveLength(0);
    expect(result.metadata.count).toBe(0);
    expect(result.metadata).not.toHaveProperty('error');
  });

  it('should handle backend error responses correctly', async () => {
    const errorResponse = {
      response: {
        status: 500,
        data: {
          status: 'error',
          message: 'Failed to search flights',
          error: 'API rate limit exceeded - please try again in a few minutes'
        }
      }
    };

    mockedAxios.get.mockRejectedValueOnce(errorResponse);

    await expect(
      searchFlightsWithMetadata({
        originLocationCode: 'JFK',
        destinationLocationCode: 'DFW',
        departureDate: '2025-06-07',
        adults: 1,
        travelClass: 'ECONOMY'
      })
    ).rejects.toThrow('API rate limit exceeded - please try again in a few minutes');
  });
}); 