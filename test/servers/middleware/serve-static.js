const { join } = require('path');
const { existsSync, readFileSync, statSync } = require('fs');

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
    const path = trimSlashes(req.path);

    if (path) {
      const filepath = join(process.cwd(), 'test', 'static', path);

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
