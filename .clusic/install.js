module.exports = () => {
  return {
    contextName: 'redis',
    options: {
      port: 6379,
      host: '127.0.0.1',
      password: 'password'
    }
  }
};