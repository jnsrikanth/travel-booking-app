const redis = require('redis');

(async () => {
  const client = redis.createClient();
  client.on('error', (err) => console.error('Redis Client Error', err));
  await client.connect();
  await client.flushAll();
  console.log('Redis cache cleared.');
  await client.quit();
})(); 