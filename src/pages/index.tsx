import React, { useState } from 'react';
import Head from 'next/head';
import FlightSearch from '../components/FlightSearch';
import FlightResults from '../components/FlightResults';
import ErrorBoundary from '../components/ErrorBoundary';
import { Flight, SearchParams, FlightSearchResponse } from '../types/flight';
import { searchFlights, searchFlightsWithMetadata } from '../api/aviation';

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFutureDate, setIsFutureDate] = useState<boolean>(false);
  const [searchMetadata, setSearchMetadata] = useState<FlightSearchResponse['metadata'] | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<{
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
  } | null>(null);
  
  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    
    // Check if search date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time to start of day for proper comparison
    const searchDate = new Date(params.departureDate);
    searchDate.setHours(0, 0, 0, 0); // also reset search date time for proper comparison
    const isFutureDate = searchDate > today;
    setIsFutureDate(isFutureDate);
    
    console.log(`[FRONTEND DEBUG] Date comparison: searchDate=${searchDate.toISOString()}, today=${today.toISOString()}, isFutureDate=${isFutureDate}`);
    
    // Save search criteria for the FlightResults component
    setSearchCriteria({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate
    });
    
    try {
      // Use the new method that returns both flights and metadata
      const response = await searchFlightsWithMetadata(params);
      setFlights(response.flights);
      setSearchMetadata(response.metadata);
      
      // Clear previous top-level error
      setError(null);

      // If the backend's metadata contains an 'error' field (e.g., from AviationStack itself),
      // set the main error state ONLY IF we don't also have a specific "no flights found" message
      // in metadata.message (which FlightResults component is designed to handle for empty flight lists).
      if (response.metadata?.error && !(response.flights.length === 0 && response.metadata?.message)) {
        setError(response.metadata.error || 'An error occurred with the flight data provider.');
      }
      // If response.flights.length === 0 and response.metadata.message exists,
      // FlightResults will handle displaying it via its empty state logic.
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred searching for flights.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Travel Booking App</title>
        <meta name="description" content="Book your next flight" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ErrorBoundary>
        <main className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-blue-700">Travel Booking App</h1>
              <p className="text-gray-600">Find and book your perfect flight</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <FlightSearch onSearch={handleSearch} isLoading={isLoading} />
              </div>
              
              <div className="lg:col-span-2">
                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                    <p>{error}</p>
                  </div>
                )}
                
                {/* Show flight results if we're loading, have flights, or have metadata with an error message */}
                {((searchCriteria && !isLoading) || flights.length > 0 || (error !== null)) && (
                  <FlightResults
                    flights={flights}
                    isLoading={isLoading}
                    error={error}
                    searchCriteria={searchCriteria || undefined}
                    metadata={searchMetadata || undefined}
                  />
                )}
              </div>
            </div>
          </div>
          
          <footer className="bg-gray-800 text-white py-6 mt-12">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-400 text-sm mb-2">
                &copy; {new Date().getFullYear()} Travel Booking App. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                This is a demonstration project only. No real bookings will be made.
              </p>
            </div>
          </footer>
        </main>
      </ErrorBoundary>
    </>
  );
}
