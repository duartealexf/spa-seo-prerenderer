require('dotenv').config();
const express = require('express');
const { join } = require('path');

const { Prerenderer } = require('../dist/lib/Prerenderer');

const app = express();

/** @type {import('serve-static').ServeStaticOptions} */
const options = {};

app.use(express.static(join(__dirname, 'static'), options));

/** @type {import('http').Server} */
let server;

module.exports = {
  server: app,
  start: async () =>
    new Promise((resolve) => {
      server = app.listen(process.env.TEST_STATIC_SERVER_PORT || 7800, () => {
        resolve();
      });
    }),
  close: async () =>
    new Promise((resolve) => {
      if (server) {
        return server.close(resolve);
      }
      resolve();
    }),
  /**
   * @type {(p: import('../dist/types/Config').PrerendererConfigParams) => Promise<void>}
   */
  attachPrerendererWithConfig: async (config) => {
    const p = new Prerenderer(config);
    await p.initialize();

    /**
     * Typical Express usage.
     */
    app.use((req, res, next) => {
      // if (p.shouldPrerender(req)) {
      //   return p.prerender(req, res);
      // }
      return next();
    });
  }
};
