/**
 * Process file that starts an Express server and attach the Prerenderer as a middleware, to be serving
 * behind an Apache or Nginx proxy. This is the minimalistic setup needed to have the service running.
 *
 * ⚠️ Important:
 *
 * - Construct the PrerendererService with the needed configuration. Always provide databaseOptions.
 * - Start the Prerenderer Service before receiving requests, and wait for database availability.
 * - Listen to process exit events to shutdown server and Prerenderer Service gracefully.
 */

require('dotenv').config();
const express = require('express');
const killPort = require('kill-port');
const { PrerendererService } = require('spa-seo-prerenderer');

const port = 9000;

/**
 * @type {import('http').Server}
 */
let expressServer;

/**
 * @type {import('spa-seo-prerenderer').PrerendererService}
 */
const prerendererService = new PrerendererService({
  databaseOptions: {
    host: 'mongodb',
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_DATABASE,
    authSource: 'admin',
  },
});

/**
 * Main server process.
 */
const main = async () => {
  /**
   * It is required to start the service before receiving requests.
   *
   * Additionally, as MongoDB is in Docker and is started
   * simultaneously, we wait for it to be available.
   */
  await prerendererService.start();
  await prerendererService.getDatabase().waitForDatabaseAvailability();

  const app = express();

  /**
   * Add any other middleware you may need.
   */
  // app.use(...)

  /**
   * Attach prerenderer middleware.
   */
  app.use(prerendererMiddleware);

  // app.use(...)

  /**
   * Clear port and start express server.
   */
  await killPort(port);

  expressServer = await new Promise((resolve) => {
    const s = app.listen(port, '0.0.0.0', () => {
      resolve(s);
    });
  });
};

/**
 * Bind handlers to process events.
 */
const bindProcessEvents = () => {
  process.on('uncaughtException', (error) => handleExit('uncaughtException', error));
  process.on('unhandledRejection', (reason) => handleExit('unhandledRejection', reason));
  process.on('SIGHUP', () => handleExit('SIGHUP'));
  process.on('SIGINT', () => handleExit('SIGINT'));
  process.on('SIGQUIT', () => handleExit('SIGQUIT'));
};

/**
 * Hook that runs before exiting process.
 */
const onExit = async () => {
  if (expressServer) {
    await new Promise((resolve) => expressServer.close(resolve));
  }
  if (prerendererService) {
    await prerendererService.stop();
  }
};

/**
 * Handle program exit, on error or on signal.
 * @param {string} event
 * @param {any} error
 */
const handleExit = (event, error = null) => {
  if (error) {
    console.error(error);
  }
  console.log(`Received ${event}`);

  onExit().then(() => {
    process.exit(error ? 1 : 0);
  });
};

/**
 * Prerenderer middleware that always prerenders request. It does not
 * need to decide whether it should prerender because this is already
 * done in Nginx or Apache. So it prerenders and sends response.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {(err?: any) => void} next
 */
const prerendererMiddleware = (req, res, next) => {
  /**
   * Standard procedure, handle request and then send the snapshot as reponse.
   * Lastly, save it if needed.
   */
  prerendererService
    .handleRequest(req)
    .then((/** @type {import('spa-seo-prerenderer').Snapshot} */ snapshot) => {
      res
        .status(snapshot.getStatusForResponse())
        .set(snapshot.getHeadersForResponse())
        .send(snapshot.getBodyForResponse());

      snapshot.saveIfNeeded();
    })
    .catch((err) => {
      next(err);
    });
};

bindProcessEvents();

main().then(() => {
  console.log(`Prerenderer is running on port ${port}.`);
});
