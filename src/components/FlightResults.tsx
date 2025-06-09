import React from 'react';
import { Flight, FlightSearchResponse } from '@/types/flight';

interface FlightResultsProps {
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  searchCriteria?: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
  };
  metadata?: FlightSearchResponse['metadata'];
}

const FlightResults: React.FC<FlightResultsProps> = ({ 
  flights, 
  isLoading, 
  error,
  searchCriteria,
  metadata
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

  // Add a helper to determine if this is a future flight search
  const isFutureDate = searchCriteria && new Date(searchCriteria.departureDate) > new Date();

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

  // Helper function to extract error context from error message
  const getErrorContext = (errorMessage: string) => {
    // Check for rate limit errors
    if (errorMessage.toLowerCase().includes('rate limit') || 
        errorMessage.toLowerCase().includes('too many requests') ||
        errorMessage.toLowerCase().includes('429')) {
      return {
        type: 'rate_limit',
        title: 'Rate Limit Reached',
        message: 'We\'ve temporarily reached our API request limit. Please wait a moment and try again.'
      };
    }
    
    // Check for API response format errors
    if (errorMessage.toLowerCase().includes('unexpected api response') || 
        errorMessage.toLowerCase().includes('invalid api response') ||
        errorMessage.toLowerCase().includes('response format')) {
      return {
        type: 'api_format',
        title: 'Limited Flight Data',
        message: 'The flight data provider returned limited results. This route may have fewer available flights.'
      };
    }
    
    // Check for future flight specific errors
    if (errorMessage.includes('future flight') || 
        errorMessage.includes('Future flight') ||
        errorMessage.includes('schedule') ||
        errorMessage.includes('date validation')) {
      return {
        type: 'future_flight',
        title: 'Future Flight Data Unavailable',
        message: 'We cannot retrieve flight schedules for the selected future date.'
      };
    }
    
    // Check for API limitations
    if (errorMessage.includes('API') || 
        errorMessage.includes('usage limit')) {
      return {
        type: 'api_limit',
        title: 'API Service Limitation',
        message: 'Our flight data service has limitations. Try searching for popular routes or different dates.'
      };
    }
    
    // Default error
    return {
      type: 'general',
      title: 'Error',
      message: errorMessage
    };
  };

  // Get today's date as YYYY-MM-DD for suggestions
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get a date 7 days from now for near-term suggestions
  const getNearTermDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // Error state
  if (error) {
    const errorContext = getErrorContext(error);
    const isFutureDate = searchCriteria && new Date(searchCriteria.departureDate) > new Date();
    
    // This is a future date search check (already handled above)
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-red-800">{errorContext.title}</h3>
          <p className="text-red-700">{errorContext.message}</p>
          
          {/* Add future flight specific message if applicable */}
          {isFutureDate && (
            <p className="mt-2 text-orange-700">
              Note: Future flight searches require the paid tier AviationStack API. 
              Ensure that your API key has the appropriate permissions.
            </p>
          )}
          
          {/* Show technical error details for debugging */}
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">Technical details</summary>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </details>
        </div>
        
        {/* Show helpful suggestions based on error type */}
        {errorContext.type === 'future_flight' && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Suggestions:</h4>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>Try searching for flights today ({getTodayFormatted()})</li>
              <li>Search for flights within the next 7 days (until {getNearTermDate()})</li>
              <li>Future flight schedules require at least 7 days advance notice</li>
              <li>Future flight schedules are available up to 11 months in advance</li>
              <li>Our paid AviationStack API is used for future flight data</li>
              {metadata?.dateValidation && (
                <li className="text-blue-600">{metadata.dateValidation.message}</li>
              )}
            </ul>
            
            {metadata?.possibleReasons && metadata.possibleReasons.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700">Possible reasons:</h4>
                <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                  {metadata.possibleReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {errorContext.type === 'api_limit' && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Suggestions:</h4>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>Wait a few seconds before trying again</li>
              <li>Try searching for major airports (JFK, LAX, LHR, etc.)</li>
              <li>Search for popular routes that typically have more flights</li>
              <li>Consider searching for dates within the next 30 days</li>
            </ul>
          </div>
        )}
        
        {errorContext.type === 'rate_limit' && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">What to do:</h4>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>Wait 10-15 seconds before searching again</li>
              <li>The API allows 1 request per second</li>
              <li>Avoid rapid consecutive searches</li>
            </ul>
          </div>
        )}
        
        {errorContext.type === 'api_format' && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Try these alternatives:</h4>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>Search for busier routes (e.g., NYC-LA, NYC-London)</li>
              <li>Try different dates, especially weekdays</li>
              <li>Search for major hub airports</li>
              <li>Some routes may have limited or seasonal service</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Empty results
  if (flights.length === 0) {
    const isFutureDate = searchCriteria && new Date(searchCriteria.departureDate) > new Date();
    console.log('[FlightResults] No flights. Metadata received:', metadata); // Debug line
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No flights found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchCriteria 
              ? `No flights available from ${searchCriteria.originLocationCode} to ${searchCriteria.destinationLocationCode} on ${formatDate(searchCriteria.departureDate)}`
              : 'We couldn\'t find any flights matching your search criteria.'}
          </p>
        </div>
        
        {/* API Limitations Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Flight Availability</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>The Aviation Stack API may have limited data for:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Less popular routes or smaller airports</li>
                  <li>Flights more than 7 days in the future</li>
                  <li>Regional or charter airlines</li>
                  <li>Seasonal routes that aren't currently operating</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Helpful suggestions */}
        <div className="mt-4">
          <h4 className="font-medium text-gray-700">Try these suggestions:</h4>
          <ul className="list-disc list-inside mt-2 text-gray-600 space-y-2">
            <li>
              <strong>Use major airports:</strong> JFK (New York), LAX (Los Angeles), ORD (Chicago), 
              DFW (Dallas), ATL (Atlanta), LHR (London), CDG (Paris)
            </li>
            <li>
              <strong>Search popular routes:</strong> NYC-LA, NYC-London, LA-Tokyo, etc.
            </li>
            <li>
              <strong>Try different dates:</strong> Weekdays often have more business flights
            </li>
            <li>
              <strong>Check date range:</strong> Best results for flights within the next 30 days
            </li>
            {isFutureDate && (
              <li>
                <strong>Future flights:</strong> Airlines typically publish schedules 7-330 days in advance
              </li>
            )}
          </ul>
        </div>
        
        {/* Show metadata context if available */}
        {(metadata?.message || (metadata?.possibleReasons && metadata.possibleReasons.length > 0)) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {metadata.message && (
              <p className="text-sm text-gray-600 mb-2">{metadata.message}</p>
            )}
            {metadata.possibleReasons && metadata.possibleReasons.length > 0 && (
              <>
                <h4 className="font-medium text-gray-700 text-sm">Additional information:</h4>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                  {metadata.possibleReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Check if we have future date flights
  const hasMockData = flights.some(flight => flight.isMockData);

  return (
    <div className="space-y-4">
      {/* Add a label at the top of the results */}
      {searchCriteria && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${isFutureDate ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
            >
              {isFutureDate ? 'Future Flights (Scheduled)' : 'Current Flights (Live/Recent)'}
            </span>
          </div>
        </div>
      )}

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
                    ? "Flights for future dates are based on projected schedules from AviationStack's paid API tier and may change."
                    : "Some flight information is simulated and may not reflect actual flights."}
                </p>
                {isFutureDate && (
                  <p className="mt-1">
                    Airlines typically publish schedules 7 days to 11 months in advance. 
                    Schedule accuracy improves closer to the departure date.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Results */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {flights
            .filter(flight => flight.origin && flight.origin.iataCode && flight.destination && flight.destination.iataCode)
            .map((flight, idx) => (
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
