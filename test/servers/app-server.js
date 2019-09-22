/**
 * This server will simulate an actual NodeJS app server which is proxied from an Nginx or
 * Apache server (that do not decide whether request should prerender - so they just proxy
 * requests to NodeJS). This NodeJS server plugs the Prerenderer as a middleware, which
 * decides whether it should prerender – so it does and sends the response.
 */
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
   * Requests that have been captured.
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

    server = await new Promise((resolve) => {
      const s = app.listen(port, () => {
        resolve(s);
      });
    });
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
    const { prerenderer: p, middleware: prerendererMiddleware } = await configPrerendererMiddleware(
      config,
    );
    prerenderer = p;

    app.use(captureRequests('app'));
    app.use(prerendererMiddleware);
    app.use(serveStatic);
  },
};
