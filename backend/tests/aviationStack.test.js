const AviationStackService = require('../src/services/aviationStack');
const RedisCache = require('../src/services/redisCache');

describe('AviationStack Service', () => {
  let aviationStack;

  beforeEach(() => {
    aviationStack = new AviationStackService();
  });

  describe('searchAirports', () => {
    it('should search airports with valid keyword', async () => {
      const result = await aviationStack.searchAirports('JFK');
      expect(result).toBeDefined();
      expect(result.data.airports).toBeInstanceOf(Array);
      expect(result.data.airports.length).toBeGreaterThan(0);
    });

    it('should handle empty keyword', async () => {
      const result = await aviationStack.searchAirports('');
      expect(result).toBeDefined();
      expect(result.data.airports).toBeInstanceOf(Array);
      expect(result.data.airports.length).toBe(0);
    });
  });

  describe('searchFlights', () => {
    const validParams = {
      originLocationCode: 'DFW',
      destinationLocationCode: 'JFK',
      departureDate: '2025-06-06',
      adults: 1,
      travelClass: 'ECONOMY'
    };

    it('should search flights with valid parameters', async () => {
      const result = await aviationStack.searchFlights(validParams);
      expect(result).toBeDefined();
      expect(result.flights).toBeInstanceOf(Array);
      expect(result.flights.length).toBeGreaterThan(0);
    });

    it('should handle invalid origin airport', async () => {
      const params = { ...validParams, originLocationCode: 'XXX' };
      await expect(aviationStack.searchFlights(params)).rejects.toThrow();
    });

    it('should handle invalid destination airport', async () => {
      const params = { ...validParams, destinationLocationCode: 'XXX' };
      await expect(aviationStack.searchFlights(params)).rejects.toThrow();
    });
  });
}); 