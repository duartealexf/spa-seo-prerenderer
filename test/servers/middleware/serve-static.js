const { join } = require('path');
const { existsSync, readFileSync, statSync } = require('fs');
const { Prerenderer } = require('../../../dist/lib/prerenderer');

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
