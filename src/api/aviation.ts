import axios from 'axios';

// Define the base URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types for API responses
export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export interface Flight {
  id: string;
  airline: string;
  origin: Airport;
  destination: Airport;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  price: number;
  class: string;
  seats: string | number;
  flightNumber: string;
}

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass: 'ECONOMY' | 'BUSINESS' | 'FIRST';
}

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

// Flight search history type
export interface FlightSearchHistoryRequest {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  travelClass: string;
}

// API client functions
export const searchAirports = async (keyword: string): Promise<Airport[]> => {
  try {
    if (!keyword || keyword.length < 2) return [];
    
    const response = await axios.get(`${API_URL}/api/airports`, {
      params: { keyword }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching airports:', error);
    return [];
  }
};

export const searchFlights = async (params: FlightSearchParams): Promise<Flight[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/flights`, {
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
    
    return response.data;
  } catch (error) {
    console.error('Error searching flights:', error);
    throw new Error('Failed to search flights. Please try again later.');
  }
};

// Create a booking
export const createBooking = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/bookings`, bookingData, {
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if available
        ...(localStorage.getItem('token') && {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to create booking. Please try again.');
    }
    throw new Error('Failed to create booking. Please check your connection and try again.');
  }
};

// Record flight search history
export const recordFlightSearch = async (searchData: FlightSearchHistoryRequest): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/bookings/search-history`, searchData, {
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if available
        ...(localStorage.getItem('token') && {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        })
      }
    });
  } catch (error) {
    console.error('Error recording search history:', error);
    // Don't throw to prevent affecting the main app flow
  }
};

