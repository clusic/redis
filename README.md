# @clusic / redis

redis数据库操作类

## Install

```shell
npm i @clusic/redis
```

## Usage

```javascript
const Redis = require('@clusic/redis');
const redis = new Redis(options);

redis.connect();
await redis.disconnect();

await redis.begin();
await redis.commit();
await redis.rollback();

await redis.set(...);
await redis.get(...)
// ....
```

## Events

- beforeBegin 事务开启前
- begin 事务开启后
- beforeCommit 提交前
- commit 提交后
- beforeRollback 回滚前
- rollback 回滚后

```javascript
redis.on('begin', () => console.log('事务开始了'));
```

## In Clusic Plugin

在worker中，ctx上会存在一个你在配置[contextName]属性名的对象，指向当前redis操作对象。

```javascript
await ctx.redis.begin();
await ctx.redis.set(...);
await ctx.redis.commit();
```

在agent中，全局app[contextName]指向对应的操作对象。

```javascript
app.feed(name, async () => {
  await app.redis.begin();
  await app.redis.set(...);
  await app.redis.commit();
})
```