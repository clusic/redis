const REDIS = require('ioredis');
const commands = require('redis-commands');

class Singleton {
  constructor(dbo) {
    this.lifes = {};
    this.transacted = false;
    this.stacks = [];
    this.dbo = dbo;
  }
  
  _exec(cmd) {
    if (cmd && this.transacted && commands.hasFlag(cmd, 'write')) {
      if (typeof this.dbo[cmd] === 'function') {
        return async (...args) => {
          this.stacks.push({
            cmd,
            args
          });
        }
      } else {
        throw new Error('unKnow command: ' + cmd);
      }
    }
    if (this.dbo[cmd]) {
      return this.dbo[cmd].bind(this.dbo);
    }
  }
  
  on(name, callback) {
    if (!this.lifes[name]) this.lifes[name] = [];
    this.lifes[name].push(callback);
    return this;
  }
  
  async emit(name, ...args) {
    if (this.lifes[name]) {
      const life = this.lifes[name];
      for (let i = 0; i < life.length; i++) {
        await life[i](...args);
      }
    }
  }
  
  async begin() {
    await this.emit('beforeBegin');
    this.transacted = true;
    await this.emit('begin');
  }
  
  async commit() {
    if (!this.transacted) return;
    await this.emit('beforeCommit');
    const stacks = this.stacks.map(stack => new Promise((resolve, reject) => {
      stack.args.push((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      this.dbo[stack.cmd].apply(this.dbo, stack.args);
    }));
    await Promise.all(stacks);
    this.stacks = [];
    this.transacted = false;
    await this.emit('commit');
  }
  
  async rollback() {
    if (!this.transacted) return;
    await this.emit('beforeRollback');
    this.transacted = false;
    this.stacks = [];
    await this.emit('rollback');
  }
}


module.exports = class Redis {
  constructor(options) {
    this.options = options;
    this.cluster = Array.isArray(options) && options.length > 1;
    this.dbo = null;
  }
  
  connect() {
    this.dbo = this.cluster
      ? new REDIS.Cluster(this.options)
      : new REDIS(this.options);
  }
  
  async disconnect() {
    if (this.cluster) {
      await this.dbo.quit();
    } else {
      await this.dbo.disconnect();
    }
  }
  
  context() {
    return ObjectProxy(new Singleton(this.dbo));
  }
};

function ObjectProxy(object) {
  return new Proxy(object, {
    get(obj, key) {
      if (key in obj) {
        return Reflect.get(obj, key);
      } else {
        return obj._exec(key);
      }
    }
  })
}