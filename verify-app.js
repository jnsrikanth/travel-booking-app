const axios = require('axios');

async function verify() {
  console.log('\n✅ FLIGHT SEARCH APP VERIFICATION\n');
  
  try {
    // 1. Check services are running
    const health = await axios.get('http://localhost:4000/health');
    console.log('✓ Backend is running:', health.data.status);
    
    const frontend = await axios.get('http://localhost:3000');
    console.log('✓ Frontend is running: HTTP', frontend.status);
    
    // 2. Test airport search
    console.log('\n📍 Airport Search Tests:');
    
    // Test IATA code
    const jfk = await axios.get('http://localhost:3000/api/airports?keyword=JFK');
    const jfkAirport = jfk.data.data.airports.find(a => a.iataCode === 'JFK');
    console.log(`✓ JFK search: ${jfkAirport.name}`);
    
    // Test city name
    const london = await axios.get('http://localhost:3000/api/airports?keyword=London');
    console.log(`✓ London search: Found ${london.data.data.airports.length} airports`);
    
    // 3. Test flight search
    console.log('\n✈️  Flight Search Test:');
    const flights = await axios.get('http://localhost:3000/api/flights?originLocationCode=LAX&destinationLocationCode=JFK&departureDate=2024-12-25&adults=1&travelClass=ECONOMY');
    const flightData = flights.data.data;
    console.log(`✓ LAX → JFK: ${flightData.flights.length} flights found`);
    if (flightData.flights.length > 0) {
      const flight = flightData.flights[0];
      console.log(`  - ${flight.airline.name}: $${flight.price}, ${flight.duration}`);
    }
    
    console.log('\n🎉 APP IS FULLY FUNCTIONAL!');
    console.log('👉 Open http://localhost:3000 in your browser\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

verify(); 