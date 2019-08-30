const mocha = require('mocha');
const server = require('../static-server');

mocha.before(async () => {
  server.start();
});

mocha.after(async () => {
  server.close();
});

module.exports = server;
