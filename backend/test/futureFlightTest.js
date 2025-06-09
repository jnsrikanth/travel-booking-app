const axios = require('axios');

const apiKey = process.env.AVIATION_STACK_API_KEY || '0ce8fc39e995d3b86eb5982ea31f9004';
const baseUrl = 'https://api.aviationstack.com/v1/flights';
const dep_iata = 'JFK';
const arr_iata = 'LAX';

async function testFutureFlights() {
  for (let day = 1; day <= 30; day++) {
    const date = `2025-06-${day.toString().padStart(2, '0')}`;
    const params = {
      access_key: apiKey,
      dep_iata,
      arr_iata,
      flight_date: date,
      limit: 100,
    };
    try {
      const response = await axios.get(baseUrl, { params });
      const flights = response.data && response.data.data ? response.data.data : [];
      console.log(`Date: ${date} | Flights found: ${flights.length}`);
    } catch (error) {
      console.error(`Date: ${date} | Error:`, error.response ? error.response.data : error.message);
    }
  }
}

testFutureFlights(); 