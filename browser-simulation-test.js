const axios = require('axios');
const colors = require('colors');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:4000';

console.log('\n🌐 Browser Simulation Test'.cyan.bold);
console.log('═'.repeat(50).cyan);
console.log('Simulating user interactions with the flight booking app...\n'.gray);

async function simulateUserJourney() {
    const results = [];
    
    // Helper to log steps
    function logStep(step, success, details = '') {
        const icon = success ? '✅' : '❌';
        const color = success ? 'green' : 'red';
        console.log(`${icon} ${step}`[color]);
        if (details) console.log(`   ${details}`.gray);
        results.push({ step, success, details });
    }
    
    try {
        // 1. User visits homepage
        console.log('\n👤 User Journey: Booking a Flight from JFK to LAX\n'.yellow.bold);
        
        const homepage = await axios.get(FRONTEND_URL);
        logStep('1. User visits homepage', homepage.status === 200, `Status: ${homepage.status}`);
        
        // 2. User starts typing "jfk" in origin field
        console.log('\n🔍 Searching for airports...'.yellow);
        
        const jfkSearch = await axios.get(`${BACKEND_URL}/api/airports?keyword=jfk`);
        const jfkAirports = jfkSearch.data?.data?.airports || [];
        logStep(
            '2. User types "jfk" in origin field', 
            jfkAirports.length > 0,
            `Found ${jfkAirports.length} airports, including: ${jfkAirports[0]?.name || 'N/A'}`
        );
        
        // 3. User selects JFK
        const selectedOrigin = jfkAirports.find(a => a.iataCode === 'JFK');
        logStep(
            '3. User selects JFK airport',
            !!selectedOrigin,
            `Selected: ${selectedOrigin?.name || 'Not found'} (${selectedOrigin?.iataCode || 'N/A'})`
        );
        
        // 4. User types "lax" in destination field
        const laxSearch = await axios.get(`${BACKEND_URL}/api/airports?keyword=lax`);
        const laxAirports = laxSearch.data?.data?.airports || [];
        logStep(
            '4. User types "lax" in destination field',
            laxAirports.length > 0,
            `Found ${laxAirports.length} airports`
        );
        
        // 5. User selects LAX
        const selectedDest = laxAirports.find(a => a.iataCode === 'LAX');
        logStep(
            '5. User selects LAX airport',
            !!selectedDest,
            `Selected: ${selectedDest?.name || 'Not found'} (${selectedDest?.iataCode || 'N/A'})`
        );
        
        // 6. User selects departure date
        const departureDate = '2024-12-25';
        logStep(
            '6. User selects departure date',
            true,
            `Date: ${departureDate} (Christmas Day)`
        );
        
        // 7. User clicks search
        console.log('\n✈️  Searching for flights...'.yellow);
        
        const flightSearch = await axios.get(
            `${BACKEND_URL}/api/flights?originLocationCode=JFK&destinationLocationCode=LAX&departureDate=${departureDate}&adults=1&travelClass=ECONOMY`
        );
        
        const flights = flightSearch.data?.data?.flights || [];
        logStep(
            '7. User clicks "Search Flights"',
            flights.length > 0,
            `Found ${flights.length} flights`
        );
        
        // 8. Display flight results
        if (flights.length > 0) {
            console.log('\n📋 Flight Results:'.cyan);
            const displayFlights = flights.slice(0, 3); // Show first 3 flights
            
            displayFlights.forEach((flight, index) => {
                const depTime = new Date(flight.departure.scheduled).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const arrTime = new Date(flight.arrival.scheduled).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                console.log(`\n   Flight ${index + 1}:`.white);
                console.log(`   ${flight.airline.name} - ${flight.flight.iata}`.gray);
                console.log(`   Departure: ${depTime} → Arrival: ${arrTime}`.gray);
                console.log(`   Price: $${flight.price.total}`.green);
            });
            
            logStep(
                '8. User views flight results',
                true,
                `Prices range from $${Math.min(...flights.map(f => f.price.total))} to $${Math.max(...flights.map(f => f.price.total))}`
            );
        }
        
        // 9. Test responsive API
        console.log('\n⚡ Performance Check:'.yellow);
        
        const perfStart = Date.now();
        await axios.get(`${BACKEND_URL}/api/airports?keyword=nyc`);
        const responseTime = Date.now() - perfStart;
        
        logStep(
            '9. API Response Time',
            responseTime < 500,
            `${responseTime}ms`
        );
        
        // 10. Test error handling
        try {
            await axios.get(`${BACKEND_URL}/api/flights?originLocationCode=JFK`);
            logStep('10. Error handling (missing params)', false, 'Should have returned error');
        } catch (error) {
            logStep(
                '10. Error handling (missing params)',
                error.response?.status === 400,
                `Correctly returned ${error.response?.status} error`
            );
        }
        
        // Summary
        console.log('\n📊 User Journey Summary'.cyan.bold);
        console.log('═'.repeat(50).cyan);
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        const successRate = ((successCount / totalCount) * 100).toFixed(1);
        
        console.log(`Total Steps: ${totalCount}`.white);
        console.log(`Successful: ${successCount}`.green);
        console.log(`Failed: ${totalCount - successCount}`.red);
        console.log(`Success Rate: ${successRate}%`.yellow);
        
        if (successCount === totalCount) {
            console.log('\n🎉 Perfect User Experience! All steps completed successfully!'.green.bold);
        } else {
            console.log('\n⚠️  Some issues detected in the user journey.'.yellow.bold);
        }
        
        // Final recommendation
        console.log('\n💡 Recommendations:'.cyan.bold);
        if (flights.length > 0) {
            const cheapest = flights.reduce((min, f) => f.price.total < min.price.total ? f : min);
            console.log(`   • Cheapest flight: ${cheapest.airline.name} at $${cheapest.price.total}`.green);
            console.log(`   • ${flights.length} total options available`.gray);
        }
        console.log(`   • API performance is ${responseTime < 200 ? 'excellent' : responseTime < 500 ? 'good' : 'needs optimization'}`.gray);
        
    } catch (error) {
        console.error('\n❌ Test Error:'.red, error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the simulation
simulateUserJourney(); 