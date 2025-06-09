/**
 * Aviation Service
 * Provides flight and airport data using AviationStack API
 * Never uses mock data - errors out explicitly when API fails
 * 
 * Note on AviationStack capabilities:
 * - Supports real-time flight tracking
 * - Supports historical flight data
 * - Supports future flight schedules (availability depends on subscription tier)
 * - Does NOT provide pricing information (we handle this separately)
 */

const aviationStack = require('./aviationStack');

// AviationStack API configuration
const API_KEY = process.env.AVIATION_STACK_API_KEY;

/**
 * Validates if the required API key is available
 */
const validateApiKey = () => {
  if (!API_KEY) {
    console.error('[AVIATION SERVICE] Missing AviationStack API key');
    throw new Error('AviationStack API key is required. Set AVIATION_STACK_API_KEY in environment variables.');
  }
};

/**
 * Search for airports using keyword
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} - List of matching airports
 */
const searchAirports = async (keyword) => {
  console.log(`[AVIATION SERVICE] Searching airports with keyword: "${keyword}"`);
  
  try {
    validateApiKey();
    return await aviationStack.searchAirports(keyword);
  } catch (error) {
    console.error('[AVIATION SERVICE] Airport search error:', error.message);
    
    if (error.message.includes('rate limit')) {
      throw new Error('Our flight data provider has temporarily limited our requests. Please try again in a few minutes.');
    }
    
    throw error;
  }
};

/**
 * Search for flights using specified parameters
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} - List of matching flights
 */
const searchFlights = async (params) => {
  console.log('[AVIATION SERVICE] Searching flights with params:', params);
  
  try {
    validateApiKey();
    return await aviationStack.searchFlights(params);
  } catch (error) {
    console.error('[AVIATION SERVICE] Flight search error:', error.message);
    
    if (error.message.includes('rate limit')) {
      throw new Error('Our flight data provider has temporarily limited our requests. Please try again in a few minutes.');
    }
    
    throw error;
  }
};

/**
 * Get service status
 * @returns {Object} Service status information
 */
const getServiceStatus = () => {
  // Delegate to aviationStack's more detailed service status
  const aviationStackStatus = aviationStack.getServiceStatus();
  
  return {
    ...aviationStackStatus,
    serviceImplementation: 'aviationService using aviationStack',
    pricingAvailable: true, // We add synthetic pricing data
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  searchAirports,
  searchFlights,
  getServiceStatus,
  validateApiKey
};

