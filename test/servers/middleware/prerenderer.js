const { Prerenderer } = require('../../../dist/lib/prerenderer');

module.exports = {
  /**
   * Attach prerenderer middleware, which evaluates whether it should prerender.
   * Prerenders if needed, otherwise will pass request to next middleware.
   * @param {import('../../../dist/types/config/defaults').PrerendererConfigParams} config
   */
  configPrerendererMiddleware: async (config) => {
    const prerenderer = new Prerenderer(config);
    await prerenderer.initialize();
    await prerenderer.start();

    return {
      prerenderer,

      /**
       * Prerenderer middleware that evaluates whether it
       * should prerender, to send prerendered response.
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @param {(err?: any) => void} next
       */
      middleware: (req, res, next) => {
        if (prerenderer.shouldPrerender(req)) {
          return prerenderer
            .prerender(req, res)
            .then(() => {
              /**
               * @type {import('../../../dist/types/prerenderer').PrerendererResponse}
               */
              const response = prerenderer.getLastResponse();

              // TODO: prerenderer should write response and send it.
              res
                .status(response.headers.status)
                .set(response.headers)
                .send(response.body);
            })
            .catch((err) => {
              next(err);
            });
        }
        return next();
      },
    };
  },

  /**
   * Attach middleware that forces prerender, without evaluating whether it should prerender.
   * @param {import('../../../dist/types/config/defaults').PrerendererConfigParams} config
   */
  initializePrerenderer: async (config) => {
    const prerenderer = new Prerenderer(config);
    await prerenderer.initialize();
    await prerenderer.start();

    return {
      prerenderer,
      middleware: (req, res, next) => {
        return prerenderer
          .prerender(req, res)
          .then(() => {
            const response = prerenderer.getLastResponse();

            // TODO: prerenderer should write response, add correct headers and send it.
            res.send(response.body);
          })
          .catch((err) => {
            next(err);
          });
      },
    };
  },
};
