const { PrerendererService } = require('../../../dist/lib/service');

module.exports = {
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

            return snapshot.save();
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
