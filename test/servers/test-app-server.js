require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');

const { captureRequests, requests } = require('./middleware/request-capture');
const { configPrerendererMiddleware } = require('./middleware/prerenderer');
const { serveStatic } = require('./middleware/serve-static');

const app = express();

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

    server = await new Promise((resolve) =>{
      const s = app.listen(port, '0.0.0.0', () => {
        resolve(s);
      })},
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
  attachMiddlewares: async (config) => {
    const { prerenderer: p, middleware } = await configPrerendererMiddleware(config);
    prerenderer = p;

    app.use(captureRequests);
    app.use(middleware);
    app.use(serveStatic);
  },
};
