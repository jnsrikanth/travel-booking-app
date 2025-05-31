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
  price?: number; // Will be 0 to indicate price is unavailable
  class?: string;
  seats?: number;
  status?: string;
  isMockData?: boolean;
  simulatedDataWarning?: string;
}

export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
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
