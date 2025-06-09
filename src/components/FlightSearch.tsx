import React, { useState } from 'react';
import AirportSearch from './AirportSearch';
import { Airport, SearchParams } from '../types/flight';

interface FlightSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch, isLoading }) => {
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<string>('');
  const [adults, setAdults] = useState<number>(1);
  const [travelClass, setTravelClass] = useState<'ECONOMY' | 'BUSINESS' | 'FIRST'>('ECONOMY');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originError, setOriginError] = useState<string>();
  const [destinationError, setDestinationError] = useState<string>();
  const [showFutureFlightInfo, setShowFutureFlightInfo] = useState<boolean>(false);

  // Add debugging for origin and destination changes
  const handleOriginChange = (airport: Airport | null) => {
    console.log('[FlightSearch] Origin airport selected:', airport);
    setOrigin(airport);
    if (airport) {
      console.log(`[FlightSearch] Selected origin: ${airport.name} (${airport.iataCode})`);
    }
  };

  const handleDestinationChange = (airport: Airport | null) => {
    console.log('[FlightSearch] Destination airport selected:', airport);
    setDestination(airport);
    if (airport) {
      console.log(`[FlightSearch] Selected destination: ${airport.name} (${airport.iataCode})`);
    }
  };

  // Calculate date range constraints for future flights
  const today = new Date();
  
  // Calculate minimum future flight date (7 days from now)
  const minFutureDate = new Date(today);
  minFutureDate.setDate(today.getDate() + 7);
  const minFutureDateString = minFutureDate.toISOString().split('T')[0];
  
  // Calculate maximum future flight date (11 months from now)
  const maxFutureDate = new Date(today);
  maxFutureDate.setMonth(today.getMonth() + 11);
  const maxFutureDateString = maxFutureDate.toISOString().split('T')[0];
  
  // Today's date string for regular flights
  const todayString = today.toISOString().split('T')[0];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin) {
      newErrors.origin = 'Origin airport is required';
      setOriginError('Origin airport is required');
    } else {
      setOriginError(undefined);
    }

    if (!destination) {
      newErrors.destination = 'Destination airport is required';
      setDestinationError('Destination airport is required');
    } else if (origin && destination && origin.iataCode === destination.iataCode) {
      newErrors.destination = 'Origin and destination cannot be the same';
      setDestinationError('Origin and destination cannot be the same');
    } else {
      setDestinationError(undefined);
    }

    if (!departureDate) {
      newErrors.departureDate = 'Departure date is required';
    } else {
      const selectedDate = new Date(departureDate);
      const isFutureSearch = selectedDate > new Date(todayString);
      
      // Show future flight info if user selects a future date
      setShowFutureFlightInfo(isFutureSearch);
      
      // Validate future flight dates - must be between 7 days and 11 months from now
      if (isFutureSearch) {
        if (departureDate < minFutureDateString) {
          newErrors.departureDate = `Future flight schedules are only available for dates at least 7 days in the future (${minFutureDateString} or later)`;
        } else if (departureDate > maxFutureDateString) {
          newErrors.departureDate = `Future flight schedules are only available up to 11 months in advance (${maxFutureDateString} or earlier)`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSearch({
      originLocationCode: origin!.iataCode,
      destinationLocationCode: destination!.iataCode,
      departureDate,
      adults,
      travelClass
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Find Your Flight</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <AirportSearch
            label="From"
            placeholder="Enter city or airport"
            value={origin}
            onSelect={handleOriginChange}
            error={originError}
          />
        </div>
        
        <div className="mb-4">
          <AirportSearch
            label="To"
            placeholder="Enter city or airport"
            value={destination}
            onSelect={handleDestinationChange}
            error={destinationError}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date
          </label>
          <input
            type="date"
            min={todayString}
            max={maxFutureDateString}
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              // Check if this is a future date to show information
              const selectedDate = new Date(e.target.value);
              setShowFutureFlightInfo(selectedDate > new Date(todayString));
            }}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.departureDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
          )}
          
          {/* Future flight information */}
          {showFutureFlightInfo && !errors.departureDate && (
            <div className="mt-1 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
              <p className="font-medium">Future Flight Information:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Using AviationStack paid API for future flight schedules</li>
                <li>Available for dates between {minFutureDateString} and {maxFutureDateString}</li>
                <li>Schedule data is subject to change by airlines</li>
              </ul>
            </div>
          )}
          {/* Note for users about future flight search */}
          <div className="mt-1 text-xs text-gray-500">
            <span>
              Note: Selecting a future date will use the paid AviationStack API and may return different results than current flights.
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passengers
            </label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={travelClass}
              onChange={(e) => setTravelClass(e.target.value as 'ECONOMY' | 'BUSINESS' | 'FIRST')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ECONOMY">Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First Class</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              <span>Searching...</span>
            </div>
          ) : (
            <>
              {departureDate && new Date(departureDate) > new Date(todayString) ? 
                'Search Future Flights' : 
                'Search Flights'
              }
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FlightSearch;

