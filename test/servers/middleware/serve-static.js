const { join } = require('path');
const { existsSync, readFileSync, statSync } = require('fs');
const { Prerenderer } = require('../../../dist/lib/prerenderer');

/**
 * Hardcoded redirects for testing.
 */
const redirects = {
  '/redirect-resource/from.js': '/redirect-resource/to.js',
  '/redirect-index/from.html': '/redirect-index/to.html',
};

/**
 * Hardcoded status responses for testing.
 */
const status = {
  '/status/304.html': 304,
  '/status/400.html': 400,
  '/status/404.html': 404,
  '/status/500.html': 500,
};

/**
 * Trim slashes from string.
 * @param {string} str
 */
const trimSlashes = (str) => str.replace(/^\/+|\/+$/g, '');

module.exports = {
  /**
   * Middleware to serve static files from test/static folder.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {(err?: any) => void} next
   */
  serveStatic: (req, res, next) => {
    const parsedUrl = Prerenderer.parseUrl(req);

    if (redirects[parsedUrl.pathname]) {
      return res.redirect(301, redirects[parsedUrl.pathname]);
    }

    if (status[parsedUrl.pathname]) {
      if (status[parsedUrl.pathname] >= 400) {
        return res.sendStatus(status[parsedUrl.pathname]);
      } else {
        res.status(status[parsedUrl.pathname]);
      }
    }

    const pathname = trimSlashes(parsedUrl.pathname);

    if (pathname) {
      const filepath = join(process.cwd(), 'test', 'static', pathname);

      if (existsSync(filepath)) {
        const stat = statSync(filepath);

        if (stat.isFile()) {
          const contents = readFileSync(filepath).toString('utf8');
          res.send(contents);
        } else {
          res.send('');
        }
      } else {
        res.send('');
      }
    } else {
      res.send('');
    }

    next();
  },
};
