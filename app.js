const Redis = require('./index');
module.exports = async (app, plugin) => {
  let config = plugin.config;
  if (!config) throw new Error('@clusic/redis need configs');
  const redis = new Redis(config.options);
  redis.connect();
  app.bind('beforeStop', async () => await redis.disconnect());
  app.use(async (ctx, next) => {
    const redisContext = redis.context();
    Object.defineProperty(ctx, config.contextName || 'redis', {
      get() { return redisContext; }
    });
    redisContext.on('begin', async () => ctx.onErrorCatch(async () => await redisContext.rollback()));
    await next();
    await redisContext.commit();
  });
};
