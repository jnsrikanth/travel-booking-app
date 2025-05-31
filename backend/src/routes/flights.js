const express = require('express');
const router = express.Router();
const { generateMockFlights, searchMockAirports } = require('../services/mockFlights');

// Search flights
router.post('/search', (req, res) => {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      passengers,
      class: travelClass
    } = req.body;

    const searchParams = {
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate,
      returnDate,
      adults: passengers,
      travelClass
    };

    const flights = generateMockFlights(searchParams);
    res.json(flights);
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Failed to search flights' });
  }
});

// Search airports
router.get('/airports', (req, res) => {
  try {
    const { keyword } = req.query;
    const airports = searchMockAirports(keyword);
    res.json(airports);
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({ error: 'Failed to search airports' });
  }
});

module.exports = router;
