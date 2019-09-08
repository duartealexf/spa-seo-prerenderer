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
      middleware: (req, res, next) => {
        if (prerenderer.shouldPrerender(req)) {
          return prerenderer.prerender(req, res).catch((err) => {
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
        return prerenderer.prerender(req, res).catch((err) => {
          next(err);
        });
      },
    };
  },
};
