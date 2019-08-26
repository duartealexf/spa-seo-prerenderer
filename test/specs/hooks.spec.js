const mocha = require('mocha');
const server = require('../static-server');

mocha.before(() => {
  server.start();
});

mocha.after(() => {
  server.close();
});
