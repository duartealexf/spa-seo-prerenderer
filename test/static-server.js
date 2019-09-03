require('dotenv').config();
const express = require('express');
const static = require('serve-static');
const { join } = require('path');

/** @type {Map<string, import('express').Request>} */
const requests = new Map();

const app = express();

/**
 * Create middleware to add received requests to request array,
 * which then can be retrieved later to help testing purposes.
 */
app.use((req, res, next) => {
  const id = req.headers['x-request-id'];

  if (typeof id === 'string') {
    requests.set(id, req);
  }

  next();
});

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
   * Requests that server has received, mapped by 'x-request-id' header.
   */
  requests,

  /**
   * Start test static server.
   */
  start: async () =>
    new Promise((resolve) => {
      server = app.listen(parseInt(process.env.TEST_STATIC_SERVER_PORT, 10) || 7800, '127.0.0.1', () => {
        resolve();
      });
    }),

  /**
   * Close test static server.
   */
  close: async () =>
    new Promise((resolve) => {
      if (server) {
        return server.close(resolve);
      }
      resolve();
    }),

  /**
   * Attach prerenderer middleware with given config.
   * @type {(p: import('../dist/types/config/defaults').PrerendererConfigParams) => Promise<void>}
   */
  // attachPrerendererWithConfig: async (config) => {
  //   const p = new Prerenderer(config);
  //   await p.initialize();

  //   /**
  //    * Typical Express usage.
  //    */
  //   app.use((req, res, next) => {
  //     if (p.shouldPrerender(req)) {
  //       return p.prerender(req, res);
  //     }
  //     return next();
  //   });
  // },
};
