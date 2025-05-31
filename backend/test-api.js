
console.log("Testing AviationStack API...");
const axios = require("axios");
const apiKey = process.env.AVIATION_STACK_API_KEY;
const baseUrl = "http://api.aviationstack.com/v1";

async function testApi() {
  try {
    console.log("API Key:", apiKey);
    console.log("Making API request...");
    const response = await axios.get(`${baseUrl}/flights`, {
      params: {
        access_key: apiKey,
        dep_iata: "DFW",
        arr_iata: "SFO",
        flight_date: "2025-06-16"
      }
    });
    console.log("API Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
  }
}

testApi();

