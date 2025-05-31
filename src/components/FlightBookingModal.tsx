import React, { useState } from 'react';
import { Flight } from '@/types/flight';
import PassengerDetailsForm, { Passenger } from './PassengerDetailsForm';

// API function for booking - to be implemented in the API file later
const createBooking = async (bookingData: BookingData): Promise<BookingResponse> => {
  // This is a placeholder - we'll implement the actual API call later
  console.log('Booking data to be sent:', bookingData);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock response
  return {
    success: true,
    bookingId: `BK-${Math.floor(Math.random() * 1000000)}`,
    message: 'Booking created successfully'
  };
};

// Types for booking
export interface BookingData {
  flightId: string;
  passenger: Passenger;
  totalAmount: number;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
}

interface FlightBookingModalProps {
  flight: Flight;
  onClose: () => void;
  onSuccess: (bookingResponse: BookingResponse) => void;
}

const FlightBookingModal: React.FC<FlightBookingModalProps> = ({
  flight,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'details' | 'review' | 'payment'>('details');
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate taxes (typically around 12-18% of base fare)
  const taxAmount = Math.round(flight.price * 0.15);
  const totalAmount = flight.price + taxAmount;
  
  const handlePassengerSubmit = (passengerData: Passenger) => {
    setPassenger(passengerData);
    setCurrentStep('review');
  };
  
  const handleGoBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('details');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };
  
  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };
  
  const handleCompleteBooking = async () => {
    if (!passenger) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const bookingData: BookingData = {
        flightId: flight.id,
        passenger,
        totalAmount
      };
      
      const response = await createBooking(bookingData);
      onSuccess(response);
    } catch (err) {
      setError('Failed to complete booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600">
            {currentStep === 'details' && 'Passenger Details'}
            {currentStep === 'review' && 'Review Booking'}
            {currentStep === 'payment' && 'Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {/* Flight Summary - shown on all steps */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Flight Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{flight.airline} - {flight.flightNumber}</p>
                <div className="flex items-center mt-2">
                  <div className="mr-4">
                    <p className="text-lg font-bold">{flight.departureTime}</p>
                    <p className="text-sm text-gray-600">{flight.departureDate}</p>
                    <p className="text-sm font-medium">{flight.origin.city} ({flight.origin.iataCode})</p>
                  </div>
                  <div className="flex-1 border-t border-gray-300 mx-2"></div>
                  <div className="ml-4">
                    <p className="text-lg font-bold">{flight.arrivalTime}</p>
                    <p className="text-sm text-gray-600">{flight.arrivalDate}</p>
                    <p className="text-sm font-medium">{flight.destination.city} ({flight.destination.iataCode})</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">Duration: {flight.duration}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-800 mb-2">Price Breakdown</h4>
                <div className="flex justify-between mb-1">
                  <span>Base Fare</span>
                  <span>₹{flight.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Taxes & Fees</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step-specific content */}
          {currentStep === 'details' && (
            <PassengerDetailsForm 
              onSubmit={handlePassengerSubmit}
              isLoading={isLoading}
            />
          )}
          
          {currentStep === 'review' && passenger && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Passenger Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{passenger.title}. {passenger.firstName} {passenger.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{new Date(passenger.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{passenger.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{passenger.phone}</p>
                  </div>
                  {passenger.passportNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Passport Number</p>
                      <p className="font-medium">{passenger.passportNumber}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back to Details
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Payment Details</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="**** **** **** ****"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="***"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={3}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name as on card"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Back to Review
                </button>
                <button
                  onClick={handleCompleteBooking}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Complete Booking'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightBookingModal;

