const Amadeus = require('amadeus');

let amadeus = null;

const initializeAmadeus = () => {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET
  });
};

const searchFlights = async (params) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      travelClass
    } = params;

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      travelClass,
      currencyCode: 'USD',
      max: 20
    });

    return response.data;
  } catch (error) {
    console.error('Amadeus API Error:', error);
    throw error;
  }
};

const getAirportsByCity = async (keyword) => {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: Amadeus.location.city
    });
    return response.data;
  } catch (error) {
    console.error('Amadeus API Error:', error);
    throw error;
  }
};

module.exports = {
  initializeAmadeus,
  searchFlights,
  getAirportsByCity
};
