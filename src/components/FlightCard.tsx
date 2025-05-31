import { Flight } from '@/types/flight';

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
}

export default function FlightCard({ flight, onSelect }: FlightCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{flight.airline}</h3>
          <p className="text-sm text-gray-600">Flight {flight.flightNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-amber-600">Price Unavailable</p>
          <p className="text-sm text-gray-600">{flight.class}</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Departure</p>
          <p className="font-semibold">{flight.departureTime}</p>
          <p className="text-sm">{flight.origin.city}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Duration</p>
          <p className="font-semibold">{flight.duration}</p>
          <div className="flex items-center justify-center">
            <div className="h-0.5 w-full bg-gray-300"></div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500">Arrival</p>
          <p className="font-semibold">{flight.arrivalTime}</p>
          <p className="text-sm">{flight.destination.city}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => onSelect(flight)}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Select Flight
        </button>
      </div>
    </div>
  );
}
