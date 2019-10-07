/**
 * This server will simulate an actual NodeJS app server which is proxied from an Nginx or
 * Apache server (that do not decide whether request should prerender - so they just proxy
 * requests to NodeJS). This NodeJS server plugs the Prerenderer as a middleware, which
 * decides whether it should prerender – so it does and sends the response.
 */
require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');
const { readFileSync } = require('fs-extra');
const { join } = require('path');
const { createServer } = require('https');

const { captureRequests, requests } = require('./middleware/request-capture');
const { serveStatic } = require('./middleware/serve-static');
const {
  configPrerendererMiddleware,
  ensureSnapshotFromRequestIsSaved,
} = require('./middleware/prerenderer');

const app = express();

/** @type {import('http').Server} */
let httpServer;

/** @type {import('https').Server} */
let httpsServer;

/** @type {import('../../dist/lib/service').PrerendererService} */
let service;

module.exports = {
  ensureSnapshotFromRequestIsSaved,

  /**
   * Requests that have been captured.
   */
  requests,

  /**
   * Prerenderer service
   */
  getService: () => service,

  /**
   * Start test app server.
   */
  start: async () => {
    const httpPort = process.env.TEST_APP_NODEJS_SERVER_PORT
      ? parseInt(process.env.TEST_APP_NODEJS_SERVER_PORT, 10)
      : 7700;

    await killPort(httpPort);

    httpServer = await new Promise((resolve) => {
      const s = app.listen(httpPort, () => {
        resolve(s);
      });
    });

    const key = readFileSync(join(__dirname, 'certificates', 'app-server.key')).toString();
    const cert = readFileSync(join(__dirname, 'certificates', 'app-server.crt')).toString();

    const httpsPort = process.env.TEST_APP_NODEJS_SERVER_PORT_SECURE
      ? parseInt(process.env.TEST_APP_NODEJS_SERVER_PORT_SECURE, 10)
      : 7733;

    await killPort(httpsPort);

    httpsServer = createServer({ key, cert }, app);

    await new Promise((resolve) => {
      httpsServer.listen(httpsPort, () => {
        resolve();
      });
    });
  },

  /**
   * Close test app server.
   */
  close: async () => {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    if (httpsServer) {
      await new Promise((resolve) => httpsServer.close(resolve));
    }
    if (service) {
      await service.stop();
    }
  },

  /**
   * @param {import('../../dist/types/config/defaults').PrerendererConfig} config
   */
  attachMiddlewares: async (config) => {
    const { service: s, middleware: prerendererMiddleware } = await configPrerendererMiddleware(
      config,
    );
    service = s;

    app.use(captureRequests('app'));
    app.use(prerendererMiddleware);
    app.use(serveStatic);
  },
};
