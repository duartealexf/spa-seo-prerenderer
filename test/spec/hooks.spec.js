const ava = require('ava');
const server = require('../helpers/server');

ava.before(async () => {
  server.start();
});

ava.after(async () => {
  server.close();
});
