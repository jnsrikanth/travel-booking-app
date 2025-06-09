import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import FlightSearch from '@/components/FlightSearch';
import FlightResults from '@/components/FlightResults';
import { searchFlightsWithMetadata } from '@/api/aviation';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the API module
jest.mock('@/api/aviation', () => ({
  searchAirports: jest.fn(),
  searchFlightsWithMetadata: jest.fn(),
  recordFlightSearch: jest.fn(),
}));

describe('Flight Search Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Response Handling', () => {
    it('should handle backend response with nested data structure correctly', async () => {
      // This is the EXACT response format from your backend
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

      const mockSearchFlightsWithMetadata = searchFlightsWithMetadata as jest.MockedFunction<typeof searchFlightsWithMetadata>;
      
      // Test that the API function correctly transforms the response
      const result = await mockSearchFlightsWithMetadata({
        originLocationCode: 'JFK',
        destinationLocationCode: 'DFW',
        departureDate: '2025-06-07',
        adults: 1,
        travelClass: 'ECONOMY'
      });

      // The function should NOT throw "Unexpected API response format"
      expect(result).toBeDefined();
      expect(result.flights).toHaveLength(2);
      expect(result.metadata.count).toBe(2);
    });

    it('should NOT show "Unexpected API response format" error for valid responses with few flights', async () => {
      const { flights, isLoading, error } = {
        flights: [
          {
            id: 'AA123',
            airline: 'American Airlines',
            flightNumber: 'AA123',
            origin: { iataCode: 'JFK', name: 'John F Kennedy', city: 'New York', country: 'USA' },
            destination: { iataCode: 'DFW', name: 'Dallas Fort Worth', city: 'Dallas', country: 'USA' },
            departureDate: '2025-06-07',
            departureTime: '10:00',
            arrivalDate: '2025-06-07',
            arrivalTime: '13:00',
            duration: '3h 0m',
            price: 350,
            status: 'scheduled'
          }
        ],
        isLoading: false,
        error: null
      };

      render(<FlightResults flights={flights} isLoading={isLoading} error={error} />);

      // Should display flights, not an error
      expect(screen.getByText('American Airlines AA123')).toBeInTheDocument();
      expect(screen.queryByText('Unexpected API response format')).not.toBeInTheDocument();
      expect(screen.queryByText('Limited Flight Data')).not.toBeInTheDocument();
    });

    it('should handle empty flight results gracefully', async () => {
      const { flights, isLoading, error } = {
        flights: [],
        isLoading: false,
        error: null
      };

      render(<FlightResults flights={flights} isLoading={isLoading} error={error} />);

      // Should show helpful message, not an error
      expect(screen.getByText('No flights found')).toBeInTheDocument();
      expect(screen.getByText(/Use major airports/)).toBeInTheDocument();
      expect(screen.queryByText('Unexpected API response format')).not.toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should show rate limit error correctly', () => {
      const { flights, isLoading, error } = {
        flights: [],
        isLoading: false,
        error: 'API rate limit exceeded - please try again in a few minutes'
      };

      render(<FlightResults flights={flights} isLoading={isLoading} error={error} />);

      expect(screen.getByText('Rate Limit Reached')).toBeInTheDocument();
      expect(screen.getByText(/Wait 10-15 seconds/)).toBeInTheDocument();
    });

    it('should NOT show "Unexpected API response format" for successful responses', () => {
      const { flights, isLoading, error } = {
        flights: [
          {
            id: 'TEST123',
            airline: 'Test Airlines',
            flightNumber: 'TA123',
            origin: { iataCode: 'JFK', name: 'JFK Airport', city: 'New York', country: 'USA' },
            destination: { iataCode: 'LAX', name: 'LAX Airport', city: 'Los Angeles', country: 'USA' },
            departureDate: '2025-06-07',
            departureTime: '10:00',
            arrivalDate: '2025-06-07',
            arrivalTime: '13:00',
            duration: '3h 0m',
            price: 400,
            status: 'scheduled'
          }
        ],
        isLoading: false,
        error: null
      };

      render(<FlightResults flights={flights} isLoading={isLoading} error={error} />);

      // Should show flight, not error
      expect(screen.getByText('Test Airlines TA123')).toBeInTheDocument();
      expect(screen.queryByText(/Unexpected API response format/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Limited Flight Data/)).not.toBeInTheDocument();
    });
  });
});

describe('Flight Search Form', () => {
  it('should search for flights when form is submitted', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();

    render(<FlightSearch onSearch={onSearch} />);

    // Fill in the form
    const fromInput = screen.getByLabelText('From');
    const toInput = screen.getByLabelText('To');
    const dateInput = screen.getByLabelText('Departure Date');
    const searchButton = screen.getByText('Search Flights');

    await user.type(fromInput, 'JFK');
    await user.type(toInput, 'DFW');
    await user.type(dateInput, '2025-06-07');
    await user.click(searchButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith({
        originLocationCode: 'JFK',
        destinationLocationCode: 'DFW',
        departureDate: '2025-06-07',
        adults: 1,
        travelClass: 'ECONOMY'
      });
    });
  });
}); 