import React, { useState, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { Airport } from '../types/flight';

interface Props {
  onSelect: (airport: Airport | null) => void;
  value: Airport | null;
  label?: string;
  placeholder?: string;
  error?: string;
}

interface AirportSearchResponse {
  status: string;
  data: {
    airports: Airport[];
    meta: {
      count: number;
      keyword: string;
      timestamp: string;
      quotaRemaining?: number;
      quotaLimit?: number;
    };
  };
}

const AirportSearch: React.FC<Props> = ({
  onSelect,
  value,
  label = 'Airport',
  placeholder = 'Search for airports...',
  error: propError
}) => {
  const [keyword, setKeyword] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) {
      setKeyword(`${value.name} (${value.iataCode})`);
    } else {
      setKeyword('');
    }
  }, [value]);

  const handleSearch = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword || searchKeyword.length < 2) {
      setAirports([]);
      setError(null);
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      console.log(`[AirportSearch] Searching for keyword: "${searchKeyword}"`);

      const response = await fetch(`/api/airports?keyword=${encodeURIComponent(searchKeyword)}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AirportSearch] API Response:', result);

      // Only update state if this is still the current request
      if (!abortControllerRef.current.signal.aborted) {
        if (
          result.status === 'success' &&
          result.data?.airports &&
          Array.isArray(result.data.airports)
        ) {
          const airports = result.data.airports.map((airport: any) => ({
            iataCode: airport.iata_code,
            name: airport.airport_name,
            city: airport.country_name, // Using country as city fallback since city isn't in the response
            country: airport.country_name
          }));
          console.log(`[AirportSearch] Found ${airports.length} airports`, airports);
          setAirports(airports);
          if (airports.length === 0) {
            setError('No airports found matching your search');
          }
        } else {
          console.error('[AirportSearch] Invalid response format:', result);
          setError('No airports found matching your search');
        }
      }
    } catch (err: unknown) {
      // Only update error state if this wasn't an aborted request
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[AirportSearch] Error:', err);
        setError('Failed to search airports. Please try again.');
        setAirports([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchKeyword: string) => handleSearch(searchKeyword), 300),
    [handleSearch]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setKeyword(newValue);
    setShowDropdown(true);
    debouncedSearch(newValue);
  };

  const handleAirportSelect = (airport: Airport) => {
    console.log('[AirportSearch] Selected airport:', airport);
    onSelect(airport);
    setKeyword(`${airport.name} (${airport.iataCode})`);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    if (keyword.length >= 2) {
      handleSearch(keyword);
    }
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.airport-search-container')) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="relative airport-search-container">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={keyword}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
          propError ? 'border-red-500' : ''
        }`}
        aria-label={label}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="airport-search-listbox"
        aria-autocomplete="list"
      />
      {propError && <p className="mt-1 text-sm text-red-600">{propError}</p>}
      
      {showDropdown && (
        <div 
          id="airport-search-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <span className="inline-block animate-spin mr-2">⌛</span>
              Searching airports...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : airports.length > 0 ? (
            <ul className="py-1">
              {airports.map((airport) => (
                <li
                  key={airport.iataCode}
                  onClick={() => handleAirportSelect(airport)}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                  role="option"
                  aria-selected={value?.iataCode === airport.iataCode}
                >
                  <div className="font-medium">{airport.name}</div>
                  <div className="text-sm text-gray-500">
                    {airport.city}, {airport.country} ({airport.iataCode})
                  </div>
                </li>
              ))}
            </ul>
          ) : keyword.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No airports found</div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Enter at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AirportSearch;
