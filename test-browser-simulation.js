const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000';

async function simulateBrowserFlightSearch() {
  console.log('\n🌐 Simulating Browser Flight Search (JFK → DFW)\n');
  
  try {
    // Step 1: Search for origin airport
    console.log('1️⃣ User types "JFK" in From field...');
    const jfkResponse = await axios.get(`${API_BASE_URL}/api/airports?keyword=JFK`);
    console.log(`   ✅ Found ${jfkResponse.data.data.airports.length} airports`);
    
    // Step 2: Search for destination airport
    console.log('\n2️⃣ User types "DFW" in To field...');
    const dfwResponse = await axios.get(`${API_BASE_URL}/api/airports?keyword=DFW`);
    console.log(`   ✅ Found ${dfwResponse.data.data.airports.length} airports`);
    
    // Step 3: Submit flight search
    console.log('\n3️⃣ User clicks Search Flights...');
    const flightParams = {
      originLocationCode: 'JFK',
      destinationLocationCode: 'DFW',
      departureDate: '2025-06-07',
      adults: 1,
      travelClass: 'ECONOMY',
      isFutureSearch: true
    };
    
    console.log('   Request params:', flightParams);
    
    const flightResponse = await axios.get(`${API_BASE_URL}/api/flights`, { params: flightParams });
    
    console.log('\n4️⃣ Backend Response:');
    console.log(`   Status: ${flightResponse.status}`);
    console.log(`   Response structure:`, {
      status: flightResponse.data.status,
      hasData: !!flightResponse.data.data,
      flightCount: flightResponse.data.data?.flights?.length || 0,
      hasMeta: !!flightResponse.data.data?.meta
    });
    
    // Step 4: Simulate frontend processing
    console.log('\n5️⃣ Frontend Processing (searchFlightsWithMetadata):');
    
    const responseData = flightResponse.data;
    let processedResult;
    
    // This simulates the exact logic in searchFlightsWithMetadata
    if (responseData && responseData.status === 'success' && responseData.data) {
      const { flights, meta } = responseData.data;
      
      processedResult = {
        flights: flights || [],
        metadata: {
          count: meta?.count || flights?.length || 0,
          requestInfo: {
            origin: flightParams.originLocationCode,
            destination: flightParams.destinationLocationCode,
            date: flightParams.departureDate,
            class: flightParams.travelClass || 'ECONOMY'
          }
        }
      };
      
      console.log('   ✅ Response transformed successfully');
      console.log('   ✅ Flights:', processedResult.flights.length);
      console.log('   ✅ Metadata:', processedResult.metadata);
      console.log('   ✅ NO error in metadata');
    }
    
    // Step 5: Check what the UI would show
    console.log('\n6️⃣ What the UI Shows:');
    
    if (processedResult.metadata.error) {
      console.log('   ❌ ERROR WOULD BE SHOWN:', processedResult.metadata.error);
    } else if (processedResult.flights.length === 0) {
      console.log('   ℹ️  "No flights found" message with helpful suggestions');
    } else {
      console.log('   ✅ Flight results displayed:');
      processedResult.flights.forEach((flight, index) => {
        console.log(`      ${index + 1}. ${flight.airline.name} - ${flight.departure.time} to ${flight.arrival.time}`);
      });
    }
    
    console.log('\n✨ Result: NO "Unexpected API response format" error!');
    
  } catch (error) {
    console.error('\n❌ Error occurred:', error.response?.data || error.message);
  }
}

// Run the simulation
simulateBrowserFlightSearch(); 