module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AVIATION_STACK_API_KEY: process.env.AVIATION_STACK_API_KEY,
  USE_MOCK_DATA: false,
  REDIS_CONFIG: {
    host: 'localhost',
    port: 6379
  },
  CACHE_TTL: {
    AIRPORTS: 24 * 60 * 60, // 24 hours
    FLIGHTS: 5 * 60, // 5 minutes
    API_CALLS: 60 // 1 minute
  },
  RATE_LIMITS: {
    REQUESTS_PER_SECOND: 2,
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_MONTH: 10000
  }
}; 