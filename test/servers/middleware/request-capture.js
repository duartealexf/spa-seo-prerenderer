/**
 * Requests mapped by x-request-id header.
 * @type {Map<string, { request: import('express').Request, context: 'prerender' | 'static' | 'app' }>}
 */
const requests = new Map();

/**
 * Middleware to add received requests to request map,
 * which then can be retrieved later to help testing.
 * @param {'prerender' | 'static' | 'app'} context Context (which server) is capturing requests.
 */
const captureRequests = (context) => {
  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {(err?: any) => void} next
   */
  const middleware = (request, response, next) => {
    const id = request.headers['x-request-id'];

    if (typeof id === 'string') {
      requests.set(id, {
        request,
        context,
      });
    }

    next();
  };

  return middleware;
};

module.exports = {
  requests,
  captureRequests,
};
