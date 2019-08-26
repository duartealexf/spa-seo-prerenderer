require('dotenv').config();
const express = require('express');
const { join } = require('path');

const app = express();

/** @type {import('serve-static').ServeStaticOptions} */
const options = {};

app.use(express.static(join(__dirname, 'static'), options));

/** @type {import('http').Server} */
let server;

module.exports = {
  server: app,
  start: () => {
    server = app.listen(process.env.TEST_STATIC_SERVER_PORT || 7800);
  },
  close: () => {
    if (server) {
      server.close();
    }
  },
};
