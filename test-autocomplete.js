const axios = require('axios');

async function testAutocomplete() {
  console.log('\n🔍 Testing Airport Autocomplete Functionality\n');
  
  const testCases = [
    { input: 'JFK', expected: 'John F Kennedy International' },
    { input: 'LAX', expected: 'Los Angeles International' },
    { input: 'LHR', expected: 'London Heathrow' },
    { input: 'New', expected: 'New' }, // Should find New York, New Orleans, etc.
    { input: 'Par', expected: 'Paris' }, // Should find Paris airports
  ];

  for (const test of testCases) {
    try {
      const response = await axios.get(`http://localhost:3000/api/airports?keyword=${test.input}`);
      const airports = response.data.data.airports;
      
      console.log(`\n✅ Search for "${test.input}":`);
      console.log(`   Found ${airports.length} airports`);
      
      // Show first 3 results
      airports.slice(0, 3).forEach(airport => {
        console.log(`   - ${airport.name} (${airport.iataCode}) - ${airport.city}, ${airport.country}`);
      });
      
      // Check if expected result is found
      const found = airports.some(a => 
        a.name.toLowerCase().includes(test.expected.toLowerCase()) ||
        a.city.toLowerCase().includes(test.expected.toLowerCase())
      );
      
      if (!found && test.expected !== test.input) {
        console.log(`   ⚠️  Warning: Expected to find "${test.expected}" in results`);
      }
    } catch (error) {
      console.log(`\n❌ Search for "${test.input}" failed: ${error.message}`);
    }
  }
  
  console.log('\n✅ Autocomplete test complete!\n');
}

testAutocomplete(); 