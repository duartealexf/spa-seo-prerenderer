const mocha = require('mocha');
const server = require('../helpers/node-server');

mocha.before(() => {
  server.start();
});

mocha.after(() => {
  server.close();
});
