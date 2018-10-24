const Redis = require('./index');
module.exports = async (app, plugin) => {
  let config = plugin.config;
  if (!config) throw new Error('@clusic/redis need configs');
  const redis = new Redis(config.options);
  redis.connect();
  app.bind('stop', async () => await redis.disconnect());
  const redisContext = redis.context();
  Object.defineProperty(app, config.contextName || 'redis', {
    get() { return redisContext; }
  });
};