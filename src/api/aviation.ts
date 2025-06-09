'use client';

import axios, { AxiosError } from 'axios';
import { 
  Airport, 
  Flight, 
  SearchParams, 
  FlightSearchResponse,
  FlightSearchHistoryRequest
} from '../types/flight';

// Define the airport API response structure
interface AirportApiResponse {
  status: string;
  data: {
    airports: Airport[];
    meta: {
      count: number;
      keyword: string;
      timestamp: string;
      quotaRemaining?: string;
      quotaLimit?: string;
    };
  };
}

// Re-export types needed by components
export type { Airport, Flight, FlightSearchResponse, FlightSearchHistoryRequest };

// Define the base URL from environment variable
// Base URL for API requests
const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
  : 'http://backend:4000';

// Ensure the URL doesn't have a trailing slash
const normalizedApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Create the full API URL
const buildApiUrl = (endpoint: string) => {
  // Remove any duplicate 'api' in the path
  const cleanEndpoint = endpoint.replace(/^api\//, '');
  const url = `${normalizedApiUrl}/api/${cleanEndpoint}`;
  console.log(`[API DEBUG] Built URL: ${url}, Original endpoint: ${endpoint}`);
  console.log(`[API] Making request to: ${url}`);
  return url;
};

// Common axios configuration for API requests
const axiosConfig = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: false,  // Important for CORS
  timeout: 10000
};

// Debug utility for conditional logging
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Debug]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', ...args);
    }
  }
};

// Export the SearchParams as FlightSearchParams for backward compatibility
export type FlightSearchParams = SearchParams;

// Passenger type definition
export interface Passenger {
  title: 'Mr' | 'Mrs' | 'Ms';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  email: string;
  phone: string;
}

// Booking request data type
export interface BookingRequest {
  flightId: string;
  passenger: Passenger;
  totalAmount: number;
  currency?: string;
}

// Booking response type
export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  bookingReference?: string;
  message: string;
}

// Using FlightSearchHistoryRequest from '../types/flight'

// API client functions
export const searchAirports = async (keyword: string): Promise<Airport[]> => {
  const startTime = new Date().getTime();
  // Trim the keyword to prevent leading/trailing spaces
  const trimmedKeyword = keyword.trim();
  
  // Log all configuration details
  console.log('[API DEBUG] Configuration:', {
    API_URL: API_URL,
    normalizedApiUrl: normalizedApiUrl,
    fullEndpoint: buildApiUrl('airports'),
    keyword: trimmedKeyword,
    timestamp: new Date().toISOString()
  });
  
  try {
    if (!trimmedKeyword || trimmedKeyword.length < 2) {
      console.log('[API] Search cancelled - keyword too short');
      return [];
    }

    // Build the URL and query params properly for more reliable handling
    const requestUrl = buildApiUrl('airports'); // Remove 'api/' from the call
    console.log(`[API DEBUG] Making request to: ${requestUrl}?keyword=${encodeURIComponent(trimmedKeyword)}`);

    // Log detailed request information
    debug.log('[API DEBUG] Request details:', {
      method: 'GET',
      url: requestUrl,
      params: { keyword: trimmedKeyword },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      withCredentials: false
    });

    // Make the API request with the correct response type and params
    const response = await axios.get<AirportApiResponse>(requestUrl, {
      params: {
        keyword: trimmedKeyword
      },
      ...axiosConfig
    });

    const duration = new Date().getTime() - startTime;
    
    // Log the detailed response for debugging
    console.log('[API DEBUG] Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    // Validate the response data format
    if (!response.data) {
      console.error('[API] Empty response received');
      throw new Error('No response received from server');
    }

    // Extract airports from the response structure
    if (!response.data.status || response.data.status !== 'success' || !response.data.data || !Array.isArray(response.data.data.airports)) {
      console.error('[API] Invalid response format:', response.data);
      throw new Error('Invalid response format from server');
    }
    
    const airportsArray = response.data.data.airports;
    console.log(`[API] Successfully extracted ${airportsArray.length} airports from response`);
    
    // Log quota information if available
    const { quotaRemaining, quotaLimit } = response.data.data.meta || {};
    if (quotaRemaining && quotaLimit) {
      console.log(`[API] API Quota: ${quotaRemaining}/${quotaLimit} remaining`);
    }
    
    // Validate that each item has the required Airport properties with proper type checking
    const validAirports = airportsArray.filter((airport): airport is Airport => {
      return airport &&
             typeof airport === 'object' &&
             typeof airport.iataCode === 'string' &&
             typeof airport.name === 'string';
    });
    
    if (validAirports.length < airportsArray.length) {
      console.warn('[API] Some airport objects had invalid format and were filtered out');
    }

    console.log(`[API] Search completed in ${duration}ms:`, {
      status: response.status,
      responseStatus: response.data.status,
      resultsCount: validAirports.length,
      firstResult: validAirports.length > 0 ? validAirports[0] : null
    });

    return validAirports;
  } catch (error) {
    const duration = new Date().getTime() - startTime;
    console.error(`[API] Search failed after ${duration}ms:`, error);
    
    // Log comprehensive error details
    console.error('[API DEBUG] Error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      axiosError: axios.isAxiosError(error) ? {
        config: error.config,
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers
      } : null
    });
    
    // Use axios.isAxiosError for better type checking
    if (axios.isAxiosError(error)) {
      // Log full request details for debugging
      console.error('[API] Request details:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers,
        data: error.config?.data,
        timeout: error.config?.timeout
      });

      // Check for common network errors
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Could not connect to the airport search service. Please check if the backend service is running on port 4000.');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again.');
      }
      
      if (error.response) {
        // Log response details
        console.error('[API] Response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });
        
        // Handle specific HTTP status codes
        switch (error.response.status) {
          case 404:
            throw new Error('Airport search endpoint not found. Please check the API configuration and URL.');
          case 429:
            throw new Error('Too many requests to the AviationStack API. Please try again in a moment.');
          case 500:
            throw new Error('Internal server error. Please try again later.');
          default:
            throw new Error(error.response.data?.message || 'Failed to search airports. Please try again.');
        }
      }
      
      // If no response was received (network error)
      throw new Error(`Network error while searching airports: ${error.message}. Please check your connection and API URL configuration.`);
    }
    
    // For non-Axios errors
    throw new Error(`An unexpected error occurred while searching airports: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Search for flights based on the provided parameters
 * @param params Flight search parameters
 * @returns Promise that resolves to an array of flights
 */
export const searchFlights = async (params: FlightSearchParams): Promise<Flight[]> => {
  try {
    const response = await axios.get<FlightSearchResponse>(buildApiUrl('flights'), {
      ...axiosConfig,
      params
    });
    
    // Record the search in history (no authentication required)
    try {
      await recordFlightSearch({
        origin: params.originLocationCode,
        destination: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: params.adults,
        travelClass: params.travelClass,
      });
    } catch (searchError) {
      console.error('Failed to record search history:', searchError);
      // Don't fail the main operation if search recording fails
    }
    
    // Check if response data has a structured format with flights array
    if (response.data && 'flights' in response.data) {
      // Extract flights array from the structured response
      return response.data.flights || [];
    } else {
      // If for some reason the response structure changes or is different than expected
      console.error('Unexpected API response format, missing flights array:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    }
  } catch (error) {
    console.error('Error searching flights:', error);
    throw new Error('Failed to search flights. Please try again later.');
  }
};

// Search for future flights (calls /flightsFuture)
export const searchFutureFlightsWithMetadata = async (params: FlightSearchParams): Promise<FlightSearchResponse> => {
  try {
    const response = await axios.get(buildApiUrl('flightsFuture'), {
      ...axiosConfig,
      params
    });
    // Handle the backend response format which has status, data, and nested structure
    if (response.data && response.data.status === 'success' && response.data.data) {
      const { flights, meta } = response.data.data;
      return {
        flights: flights || [],
        metadata: {
          count: meta?.count || flights?.length || 0,
          requestInfo: {
            origin: params.originLocationCode,
            destination: params.destinationLocationCode,
            date: params.departureDate,
            class: params.travelClass || 'ECONOMY'
          }
        }
      };
    } else if (response.data && 'flights' in response.data && 'metadata' in response.data) {
      return response.data;
    } else {
      const flightsArray = Array.isArray(response.data) ? response.data as Flight[] : [];
      return {
        flights: flightsArray,
        metadata: {
          count: flightsArray.length,
          requestInfo: {
            origin: params.originLocationCode,
            destination: params.destinationLocationCode,
            date: params.departureDate,
            class: params.travelClass || 'ECONOMY'
          }
        }
      };
    }
  } catch (error) {
    console.error('Error searching future flights with metadata:', error);
    throw new Error('Failed to search future flights. Please try again later.');
  }
};

// Patch searchFlightsWithMetadata to smartly call the correct endpoint
export const searchFlightsWithMetadata = async (params: FlightSearchParams): Promise<FlightSearchResponse> => {
  // Check if this is a future date search
  const searchDate = new Date(params.departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset time to start of day for proper comparison
  searchDate.setHours(0, 0, 0, 0); // also reset search date time for proper comparison
  const isFutureSearch = searchDate > today;
  
  console.log(`[API DEBUG] Date comparison: searchDate=${searchDate.toISOString()}, today=${today.toISOString()}, isFutureSearch=${isFutureSearch}`);
  if (isFutureSearch) {
    return searchFutureFlightsWithMetadata(params);
  } else {
    try {
      const response = await axios.get(buildApiUrl('flights'), {
        ...axiosConfig,
        params
      });
      if (response.data && response.data.status === 'success' && response.data.data) {
        const { flights, meta } = response.data.data;
        return {
          flights: flights || [],
          metadata: {
            count: meta?.count || flights?.length || 0,
            requestInfo: {
              origin: params.originLocationCode,
              destination: params.destinationLocationCode,
              date: params.departureDate,
              class: params.travelClass || 'ECONOMY'
            }
          }
        };
      } else if (response.data && 'flights' in response.data && 'metadata' in response.data) {
        return response.data;
      } else {
        const flightsArray = Array.isArray(response.data) ? response.data as Flight[] : [];
        return {
          flights: flightsArray,
          metadata: {
            count: flightsArray.length,
            requestInfo: {
              origin: params.originLocationCode,
              destination: params.destinationLocationCode,
              date: params.departureDate,
              class: params.travelClass || 'ECONOMY'
            }
          }
        };
      }
    } catch (error) {
      console.error('Error searching flights with metadata:', error);
      throw new Error('Failed to search flights. Please try again later.');
    }
  }
};

// Helper function to safely access localStorage (only in browser)
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Create a booking
export const createBooking = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    const token = getAuthToken();
    const response = await axios.post<BookingResponse>(buildApiUrl('bookings'), bookingData, {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        // Include auth token if available
        ...(token && {
          Authorization: `Bearer ${token}`
        })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } else if (error instanceof Error) {
      throw new Error(`Failed to create booking: ${error.message}. Please try again.`);
    }
    throw new Error('An unknown error occurred while creating booking. Please check your connection and try again.');
  }
};

// Record flight search history
export const recordFlightSearch = async (searchData: FlightSearchHistoryRequest): Promise<void> => {
  try {
    const token = getAuthToken();
    await axios.post(buildApiUrl('bookings/search-history'), searchData, {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        // Include auth token if available
        ...(token && {
          Authorization: `Bearer ${token}`
        })
      }
    });
  } catch (error) {
    console.error('Error recording search history:', error);
    // Don't throw to prevent affecting the main app flow
  }
};

