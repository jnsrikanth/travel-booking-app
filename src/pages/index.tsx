import React, { useState } from 'react';
import Head from 'next/head';
import FlightSearch from '@/components/FlightSearch';
import FlightResults from '@/components/FlightResults';
import { Flight, SearchParams } from '@/types/flight';
import { searchFlights } from '@/api/aviation';

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFutureDate, setIsFutureDate] = useState<boolean>(false);
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
    const searchDate = new Date(params.departureDate);
    setIsFutureDate(searchDate > today);
    
    // Save search criteria for the FlightResults component
    setSearchCriteria({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate
    });
    
    try {
      const results = await searchFlights(params);
      setFlights(results);
    } catch (err) {
      setError('Failed to search flights. Please try again.');
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
              
              {(flights.length > 0 || isLoading) && (
                <FlightResults 
                  flights={flights} 
                  isLoading={isLoading}
                  error={error}
                  searchCriteria={searchCriteria || undefined}
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
    </>
  );
}
