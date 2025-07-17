const axios = require('axios');

async function testFutureFlights() {
  try {
    console.log('Testing future flights API...');
    
    const response = await axios.get('http://localhost:4000/api/flights', {
      params: {
        originLocationCode: 'DFW',
        destinationLocationCode: 'JFK',
        departureDate: '2025-07-28',
        adults: 1,
        travelClass: 'ECONOMY'
      },
      timeout: 10000
    });

    console.log('✅ API call successful!');
    console.log('📊 Source:', response.data.apiResponse?.source || 'Unknown');
    console.log('🔢 Flights returned:', response.data.flights?.length || 0);
    
    if (response.data.flights && response.data.flights.length > 0) {
      console.log('✈️ Sample flight:', {
        airline: response.data.flights[0].airline,
        flightNumber: response.data.flights[0].flightNumber,
        departure: response.data.flights[0].departureTime,
        arrival: response.data.flights[0].arrivalTime,
        price: response.data.flights[0].price,
        isRealData: response.data.flights[0].isRealData
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
    }
  }
}

testFutureFlights();
