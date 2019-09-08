/**
 * Requests mapped by x-request-id header.
 * @type {Map<string, import('express').Request>}
 */
const requests = new Map();

/**
 * Middleware to add received requests to request map,
 * which then can be retrieved later to help testing purposes.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {() => void} next
 */
const captureRequests = (req, res, next) => {
  const id = req.headers['x-request-id'];

  if (typeof id === 'string') {
    requests.set(id, req);
  }

  next();
};

module.exports = {
  requests,
  captureRequests,
};
