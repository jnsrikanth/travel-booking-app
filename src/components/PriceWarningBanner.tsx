import React from 'react';

const PriceWarningBanner: React.FC = () => {
  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">Pricing Information Unavailable</h3>
          <div className="mt-2 text-sm">
            <p>
              The AviationStack API's free tier does not provide real pricing data for flights. 
              Therefore, pricing information is shown as "Price Unavailable" for all flights.
            </p>
            <p className="mt-1">
              This application is for demonstration purposes only and does not reflect actual flight prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceWarningBanner;

