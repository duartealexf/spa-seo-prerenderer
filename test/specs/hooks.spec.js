const mocha = require('mocha');
const server = require('../helpers/server');

mocha.before(() => {
  server.start();
});

mocha.after(() => {
  server.close();
});
