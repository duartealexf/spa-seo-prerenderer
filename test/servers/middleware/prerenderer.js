const EventEmitter = require('events');

const { PrerendererService } = require('../../../dist/lib/service');
const { getHeader } = require('../../client/response');

/**
 * Emitter of snapshot events.
 * Events:
 * - saving: when a snapshot starts saving.
 * - saved: when a snapshot is saved.
 */
const snapshotEventEmitter = new EventEmitter();

/**
 * All snapshots by id.
 */
const savedSnapshotsByRequestId = new Map();

snapshotEventEmitter.on('saved', ({ request, snapshot }) => {
  savedSnapshotsByRequestId.set(request.headers['x-request-id'], snapshot);
});

/**
 * Ensure that the snapshot from given request id is saved.
 * @param {import('http').IncomingMessage} userRequest
 * @returns {Promise<void>}
 */
const ensureSnapshotFromRequestIsSaved = (userRequest) =>
  new Promise((resolve) => {
    if (savedSnapshotsByRequestId.has(getHeader(userRequest, 'x-request-id'))) {
      return resolve();
    }

    snapshotEventEmitter.on('saved', ({ snapshot, request }) => {
      if (getHeader(userRequest, 'x-request-id') === getHeader(request, 'x-request-id')) {
        resolve();
      }
    });
  });

module.exports = {
  ensureSnapshotFromRequestIsSaved,

  /**
   * Attach prerenderer middleware, which evaluates whether it should prerender.
   * Prerenders if needed, otherwise will pass request to next middleware.
   * @param {import('../../../dist/types/config/defaults').PrerendererConfig} config
   */
  configPrerendererMiddleware: async (config) => {
    const service = new PrerendererService(config);
    await service.start();

    return {
      service,

      /**
       * Prerenderer middleware that evaluates whether it
       * should prerender, to send prerendered response.
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @param {(err?: any) => void} next
       */
      middleware: (req, res, next) => {
        if (!service.shouldHandleRequest(req)) {
          return next();
        }

        service
          .handleRequest(req)
          .then((/** @type {import('../../../dist/types/snapshot').Snapshot} */ snapshot) => {
            res
              .status(snapshot.getStatusForResponse())
              .set(snapshot.getHeadersForResponse())
              .send(snapshot.getBodyForResponse());

            return snapshot.saveIfNeeded();
          })
          .then((snapshot) => {
            snapshotEventEmitter.emit('saved', { request: req, snapshot });
          })
          .catch((err) => {
            next(err);
          });
      },
    };
  },

  /**
   * Attach middleware that forces prerender, without evaluating whether it should prerender.
   * @param {import('../../../dist/types/config/defaults').PrerendererConfig} config
   */
  startPrerenderer: async (config) => {
    const service = new PrerendererService(config);
    await service.start();
    const prerenderer = service.getPrerenderer();

    return {
      service,

      /**
       * Prerenderer middleware that always prerenders, to send prerendered response.
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @param {(err?: any) => void} next
       */
      middleware: (req, res, next) => {
        return prerenderer
          .prerenderAndGetSnapshot(req)
          .then((/** @type {import('../../../dist/types/snapshot').Snapshot} */ snapshot) => {
            res
              .status(snapshot.getStatusForResponse())
              .set(snapshot.getHeadersForResponse())
              .send(snapshot.getBodyForResponse());
          })
          .catch((err) => {
            next(err);
          });
      },
    };
  },
};
