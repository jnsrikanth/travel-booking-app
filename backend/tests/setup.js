// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AVIATION_STACK_API_KEY = 'test_api_key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  const RedisCache = require('../src/services/redisCache');
  await RedisCache.clearCache();
}); 