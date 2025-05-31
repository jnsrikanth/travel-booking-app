import React from 'react';

// Flight type definition
interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
  };
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  status?: string;
  isMockData?: boolean;
  simulatedDataWarning?: string;
}

interface FlightResultsProps {
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  searchCriteria?: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
  };
}

const FlightResults: React.FC<FlightResultsProps> = ({ 
  flights, 
  isLoading, 
  error,
  searchCriteria 
}) => {
  // Function to get status badge color
  const getStatusBadgeColor = (status?: string) => {
    if (!status) return 'bg-gray-200';
    
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'landed':
        return 'bg-purple-100 text-purple-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Empty results
  if (flights.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No flights found</h3>
        <p className="mt-1 text-sm text-gray-500">
          We couldn't find any flights matching your search criteria. Please try different dates or locations.
        </p>
      </div>
    );
  }

  // Check if we have future date flights
  const isFutureDate = searchCriteria && new Date(searchCriteria.departureDate) > new Date();
  const hasMockData = flights.some(flight => flight.isMockData);

  return (
    <div className="space-y-4">
      {/* Pricing Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Pricing Information</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Flight pricing information is not available through our data provider. Prices will be displayed as "Price Unavailable".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Data Warning - only shown for future dates or when mock data is present */}
      {(isFutureDate || hasMockData) && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Flight Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  {isFutureDate
                    ? "Flights for future dates are based on projected schedules and may change."
                    : "Some flight information is simulated and may not reflect actual flights."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Results */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {flights.map((flight) => (
            <div key={flight.id} className={`p-4 hover:bg-gray-50 ${flight.isMockData ? 'bg-gray-50' : ''}`}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                {/* Airline & Flight Number */}
                <div className="mb-2 md:mb-0">
                  <div className="flex items-center">
                    <span className="font-semibold text-lg">{flight.airline}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      Flight {flight.flightNumber}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(flight.status)}`}>
                      {flight.status || 'Unknown'}
                    </span>

                    {/* Mock Data Indicator */}
                    {flight.isMockData && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Simulated
                      </span>
                    )}
                  </div>
                </div>

                {/* Route & Time */}
                <div className="flex items-center justify-between w-full md:w-auto">
                  {/* Departure */}
                  <div className="text-center md:text-left">
                    <p className="text-lg font-bold">{flight.departureTime}</p>
                    <p className="text-sm text-gray-500">{flight.origin.iataCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(flight.departureDate)}</p>
                  </div>

                  {/* Flight Path */}
                  <div className="flex flex-col items-center mx-4">
                    <div className="text-xs text-gray-500">{flight.duration}</div>
                    <div className="w-24 h-[1px] bg-gray-300 my-2 relative">
                      <div className="absolute w-2 h-2 bg-blue-500 rounded-full -top-[3px] -left-1"></div>
                      <div className="absolute w-2 h-2 bg-blue-500 rounded-full -top-[3px] -right-1"></div>
                    </div>
                    <div className="text-xs text-gray-500">Direct</div>
                  </div>

                  {/* Arrival */}
                  <div className="text-center md:text-right">
                    <p className="text-lg font-bold">{flight.arrivalTime}</p>
                    <p className="text-sm text-gray-500">{flight.destination.iataCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(flight.arrivalDate)}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Pricing Area */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm text-gray-500">
                    {flight.origin.name} → {flight.destination.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-500">Price Unavailable</div>
                  <div className="text-xs text-gray-400">
                    Pricing not provided by AviationStack API
                  </div>
                </div>
              </div>

              {/* Simulated Data Warning */}
              {flight.simulatedDataWarning && (
                <div className="mt-2 text-xs text-orange-600 italic">
                  {flight.simulatedDataWarning}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlightResults;
