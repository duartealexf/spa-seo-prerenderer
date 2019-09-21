/**
 * This server will just deliver static content, without prerendering it. It should be proxied
 * from a Nginx or Apache server that decided whether request should be prerendered. If
 * request reaches this server, then that means that it should not be prerendered.
 */
require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');

const { captureRequests, requests } = require('./middleware/request-capture');
const { serveStatic } = require('./middleware/serve-static');

const app = express();

/** @type {import('http').Server} */
let server;

module.exports = {
  /**
   * Express app.
   */
  app,

  /**
   * Active listening server.
   */
  server,

  /**
   * Requests that have been captured.
   */
  requests,

  /**
   * Start test static server.
   */
  start: async () => {
    const port = process.env.TEST_STATIC_NODEJS_SERVER_PORT
      ? parseInt(process.env.TEST_STATIC_NODEJS_SERVER_PORT, 10)
      : 7800;

    await killPort(port);

    server = await new Promise((resolve) => {
      const s = app.listen(port, '0.0.0.0', () => {
        resolve(s);
      });
    });
  },

  /**
   * Close test static server.
   */
  close: async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  },

  attachMiddlewares: () => {
    app.use(captureRequests('static'));
    app.use(serveStatic);
  },
};
