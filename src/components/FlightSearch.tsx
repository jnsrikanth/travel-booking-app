import React, { useState } from 'react';
import AirportSearch from './AirportSearch';
import { Airport, FlightSearchParams } from '../api/aviation';

interface FlightSearchProps {
  onSearch: (params: FlightSearchParams) => void;
  isLoading: boolean;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch, isLoading }) => {
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<string>('');
  const [adults, setAdults] = useState<number>(1);
  const [travelClass, setTravelClass] = useState<'ECONOMY' | 'BUSINESS' | 'FIRST'>('ECONOMY');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get today's date in YYYY-MM-DD format for min date in date picker
  const today = new Date().toISOString().split('T')[0];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin) {
      newErrors.origin = 'Origin airport is required';
    }

    if (!destination) {
      newErrors.destination = 'Destination airport is required';
    }

    if (origin && destination && origin.iataCode === destination.iataCode) {
      newErrors.destination = 'Origin and destination cannot be the same';
    }

    if (!departureDate) {
      newErrors.departureDate = 'Departure date is required';
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
            onChange={setOrigin}
            error={errors.origin}
          />
        </div>
        
        <div className="mb-4">
          <AirportSearch
            label="To"
            placeholder="Enter city or airport"
            value={destination}
            onChange={setDestination}
            error={errors.destination}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date
          </label>
          <input
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.departureDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
          )}
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
            'Search Flights'
          )}
        </button>
      </form>
    </div>
  );
};

export default FlightSearch;

