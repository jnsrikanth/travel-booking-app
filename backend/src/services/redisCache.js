const Redis = require('ioredis');
const logger = require('../utils/logger');

// Cache TTL in seconds
const CACHE_TTL = {
  AIRPORTS: 24 * 60 * 60,    // 24 hours for airports
  FLIGHTS: 5 * 60,           // 5 minutes for flights
  API_CALLS: 60              // 1 minute for API call tracking
};

// Cache keys
const CACHE_KEYS = {
  AIRPORTS: 'airports:',
  FLIGHTS: 'flights:',
  API_CALLS: 'api:calls:'
};

// Initialize Redis client with fallback options
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: (times) => {
    const maxRetryTime = 1000 * 60; // 1 minute
    const delay = Math.min(times * 50, 2000);
    return delay > maxRetryTime ? null : delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  showFriendlyErrorStack: true
});

// Handle Redis connection events
redis.on('connect', () => {
  logger.info('[REDIS] Connected to Redis server');
});

redis.on('error', (err) => {
  logger.error('[REDIS] Connection error:', err);
});

class RedisCache {
  static generateKey(type, identifier) {
    return `${CACHE_KEYS[type]}${identifier}`;
  }

  static async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`[REDIS] Error getting key ${key}:`, error.message);
      return null;
    }
  }

  static async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error(`[REDIS] Error setting key ${key}:`, error.message);
      return false;
    }
  }

  static async delete(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`[REDIS] Error deleting key ${key}:`, error.message);
      return false;
    }
  }

  static async getCachedAirports(keyword) {
    const key = this.generateKey('AIRPORTS', keyword.toLowerCase());
    return this.get(key);
  }

  static async setCachedAirports(keyword, airports) {
    const key = this.generateKey('AIRPORTS', keyword.toLowerCase());
    return this.set(key, airports, CACHE_TTL.AIRPORTS);
  }

  static async getCachedFlights(searchParams) {
    const key = this.generateKey('FLIGHTS', this.generateFlightSearchKey(searchParams));
    return this.get(key);
  }

  static async setCachedFlights(searchParams, flights) {
    const key = this.generateKey('FLIGHTS', this.generateFlightSearchKey(searchParams));
    return this.set(key, flights, CACHE_TTL.FLIGHTS);
  }

  static async incrementApiCalls(apiKey) {
    const key = this.generateKey('API_CALLS', apiKey);
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, CACHE_TTL.API_CALLS);
      }
      return count;
    } catch (error) {
      logger.error('[REDIS] Error incrementing API calls:', error.message);
      return 0;
    }
  }

  static generateFlightSearchKey(params) {
    const { originLocationCode, destinationLocationCode, departureDate, travelClass = 'ECONOMY' } = params;
    return `${originLocationCode}-${destinationLocationCode}-${departureDate}-${travelClass}`.toLowerCase();
  }

  static async clearCache() {
    try {
      const keys = await redis.keys('*');
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('[REDIS] Error clearing cache:', error.message);
      return false;
    }
  }

  static getStatus() {
    return {
      enabled: redis.status === 'ready' || redis.status === 'connect',
      status: redis.status,
    };
  }
}

module.exports = RedisCache; 