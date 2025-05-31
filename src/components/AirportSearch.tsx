import React, { useState, useEffect, useRef } from 'react';
import { searchAirports, Airport } from '../api/aviation';

interface AirportSearchProps {
  label: string;
  placeholder: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  error?: string;
}

const AirportSearch: React.FC<AirportSearchProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error
}) => {
  const [query, setQuery] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update display query when value changes
  useEffect(() => {
    if (value) {
      setQuery(`${value.city ? `${value.city}, ` : ''}${value.name} (${value.iataCode})`);
    } else {
      setQuery('');
    }
  }, [value]);

  // Set up click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update error message when prop changes
  useEffect(() => {
    setErrorMessage(error);
  }, [error]);

  // Debounced search function
  const debouncedSearch = (searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setAirports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAirports(searchQuery);
        setAirports(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Airport search error:', error);
        setErrorMessage('Failed to search airports');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    
    if (newQuery === '') {
      onChange(null);
      setAirports([]);
      setIsOpen(false);
      return;
    }

    debouncedSearch(newQuery);
  };

  const handleAirportSelect = (airport: Airport) => {
    onChange(airport);
    setIsOpen(false);
    setErrorMessage(undefined);
  };

  return (
    <div className="relative w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div ref={dropdownRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          onClick={() => query.length >= 2 && setIsOpen(true)}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errorMessage ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
          </div>
        )}
        
        {isOpen && airports.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-auto">
            <ul className="py-1">
              {airports.map((airport) => (
                <li
                  key={airport.iataCode}
                  onClick={() => handleAirportSelect(airport)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {airport.city ? `${airport.city}, ` : ''}{airport.name}
                    </span>
                    <span className="text-gray-500">{airport.iataCode}</span>
                  </div>
                  {airport.country && (
                    <span className="text-sm text-gray-500">{airport.country}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {errorMessage && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default AirportSearch;

