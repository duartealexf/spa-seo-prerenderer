require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');

const { initializePrerenderer } = require('./middleware/prerenderer');

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
   * Start Prerenderer server.
   */
  start: async () => {
    const port = process.env.TEST_PRERENDERER_NODEJS_SERVER_PORT
      ? parseInt(process.env.TEST_PRERENDERER_NODEJS_SERVER_PORT, 10)
      : 7800;

    await killPort(port);

    server = await new Promise((resolve) =>
      app.listen(port, '0.0.0.0', () => {
        resolve();
      }),
    );
  },

  /**
   * Close Prerenderer server.
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
  attachPrerenderWithConfig: async (config) => {
    const { prerenderer: p, middleware } = await initializePrerenderer(config);

    prerenderer = p;
    app.use(middleware);
  },
};
