const Redis = require('redis');

const client = Redis.createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  await client.connect();
};

connectRedis();

const cacheKey = (params) => {
  return `flights:${Object.values(params).join(':')}`;
};

const getCachedFlights = async (params) => {
  const key = cacheKey(params);
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
};

const cacheFlights = async (params, flights) => {
  const key = cacheKey(params);
  await client.setEx(key, 3600, JSON.stringify(flights)); // Cache for 1 hour
};

module.exports = {
  getCachedFlights,
  cacheFlights
};
