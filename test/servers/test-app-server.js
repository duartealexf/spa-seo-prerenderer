require('dotenv').config();
const express = require('express');
const static = require('serve-static');
const killPort = require('kill-port');
const { join } = require('path');

const { captureRequests, requests } = require('./middleware/request-capture');
const { configPrerendererMiddleware } = require('./middleware/prerenderer');

const app = express();

app.use(captureRequests);

/**
 * Attach to serve static test files.
 * @see https://expressjs.com/en/resources/middleware/serve-static.html
 */
app.use(
  static(join(__dirname, 'static'), {
    redirect: false,
  }),
);

/** @type {import('http').Server} */
let server;

/** @type {import('../../dist/lib/prerenderer').Prerenderer} */
let prerenderer;

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
   * Requests that server has received.
   */
  requests,

  /**
   * Start test app server.
   */
  start: async () => {
    const port = process.env.TEST_APP_NODEJS_SERVER_PORT
      ? parseInt(process.env.TEST_APP_NODEJS_SERVER_PORT, 10)
      : 7700;

    await killPort(port);

    server = await new Promise((resolve) =>
      app.listen(port, '0.0.0.0', () => {
        resolve();
      }),
    );
  },

  /**
   * Close test app server.
   */
  close: async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (prerenderer) {
      await prerenderer.stop();
    }
  },

  /**
   * @param {import('../../dist/types/config/defaults').PrerendererConfigParams} config
   */
  attachPrerenderMiddleware: async (config) => {
    const { prerenderer: p, middleware } = await configPrerendererMiddleware(config);
    prerenderer = p;

    app.use(middleware);
  },
};
