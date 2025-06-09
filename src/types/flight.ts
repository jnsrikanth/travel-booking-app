export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  status?: string;
  aircraft?: string;
  delay?: {
    departure: number | null;
    arrival: number | null;
  };
  isScheduleData?: boolean;
  weekday?: string;
  // Keep backwards compatibility
  price?: number; // Will be 0 to indicate price is unavailable
  class?: string;
  seats?: number;
  isMockData?: boolean;
  simulatedDataWarning?: string;
}

/**
 * Interface for flight search history requests
 */
export interface FlightSearchHistoryRequest {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
  travelClass?: string;
}

export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
  gate?: string;
  displayName?: string;  // Optional since it can be computed
}

export interface SearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  adults?: number;
  travelClass?: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  // Maintaining backward compatibility with existing code
  from?: string;
  to?: string;
  returnDate?: string;
  passengers?: number;
  class?: string;
  tripType?: 'roundtrip' | 'oneway';
}

/**
 * Flight search response from the backend API
 * Contains both the flights array and metadata about the search
 */
export interface FlightSearchResponse {
  flights: Flight[];
  metadata: {
    count: number;
    requestInfo: {
      origin: string;
      destination: string;
      date: string;
      class: string;
    };
    dateValidation?: {
      valid: boolean;
      message: string;
    };
    apiResponseSummary?: {
      total: number;
      limit: number;
      offset: number;
    };
    error?: string;
    message?: string;
    possibleReasons?: string[];
  };
}
