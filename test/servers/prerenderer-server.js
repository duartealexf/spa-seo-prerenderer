/**
 * This server will simulate a Prerenderer-only NodeJS server which is proxied from an
 * Nginx or Apache server (that decided whether request should be prerendered). After
 * having that decision made, this server only prerenders and sends the response.
 */
require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');

const { captureRequests, requests } = require('./middleware/request-capture');
const { startPrerenderer } = require('./middleware/prerenderer');

const app = express();

/** @type {import('http').Server} */
let server;

/** @type {import('../../dist/lib/service').PrerendererService} */
let service;

module.exports = {
  /**
   * Requests that have been captured.
   */
  requests,

  /**
   * Start Prerenderer server.
   */
  start: async () => {
    const port = process.env.TEST_PRERENDERER_NODEJS_SERVER_PORT
      ? parseInt(process.env.TEST_PRERENDERER_NODEJS_SERVER_PORT, 10)
      : 7900;

    await killPort(port);

    server = await new Promise((resolve) => {
      const s = app.listen(port, '0.0.0.0', () => {
        resolve(s);
      });
    });
  },

  /**
   * Close Prerenderer server.
   */
  close: async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (service) {
      await service.stop();
    }
  },

  /**
   * @param {import('../../dist/types/config/defaults').PrerendererConfig} config
   */
  attachPrerenderWithConfig: async (config) => {
    const { service: s, middleware: prerendererMiddleware } = await startPrerenderer(config);

    service = s;
    app.use(captureRequests('prerender'));
    app.use(prerendererMiddleware);
  },
};
