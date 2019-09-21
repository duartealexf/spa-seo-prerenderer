const { request } = require('http');
const { v4: uuidv4 } = require('uuid');

const { requests } = require('../servers/app-server');
const { DEFAULT_BOT_USER_AGENTS } = require('../../dist/lib/config/defaults');
const { ClientResponse, getHeader } = require('./response');

/**
 * @type {import('http').OutgoingHttpHeaders}
 */
const defaultRequestHeaders = {
  Connection: 'keep-alive',
  Pragma: 'no-cache',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=1,*/*',
  'Cache-Control': 'no-cache',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US',
  'User-Agent': 'Mozilla/5.0',
};

/**
 * Trim slashes from string.
 * @param {string} str
 */
const trimSlashes = (str) => str.replace(/^\/+|\/+$/g, '');

/**
 * Create a request.
 * @param {string} method
 * @param {boolean} isSecure
 * @param {string} host
 * @param {number|string} port
 * @param {string} path
 * @param {any} customHeaders
 * @param {boolean} botUserAgent
 * @returns {Promise<{ request: import('http').IncomingMessage, response: ClientResponse, context: 'prerender'|'static'|'app'}>}
 */
const createRequest = (method, isSecure, host, port, path, customHeaders, botUserAgent) => {
  /**
   * Create random request id.
   */
  const id = uuidv4();

  /**
   * @type {import('http').OutgoingHttpHeaders}
   */
  const headers = {
    ...defaultRequestHeaders,
    ...customHeaders,
    'x-request-id': id,
  };

  if (botUserAgent) {
    headers['User-Agent'] = DEFAULT_BOT_USER_AGENTS[0];
  }

  return new Promise((resolve) => {
    /**
     * Make request.
     */
    request(
      {
        method,
        protocol: isSecure ? 'https:' : 'http:',
        host,
        port,
        path: `/${trimSlashes(path)}`,
        headers,
      },
      async (response) => {
        const clientResponse = await ClientResponse.fromResponse(response);

        /**
         * When receiving response, resolve promise from request that the server received.
         */
        const requestInfo = requests.get(id);
        resolve({ ...requestInfo, response: clientResponse });
      },
    ).end();
  });
};

module.exports = {
  /**
   * Create a HTTP POST request directly to NodeJS server. Note that there are not
   * many options to make a post request. This is because we don't need to focus
   * on them as much, as the Prerenderer only create snapshots for GET requests.
   * @returns {ReturnType<typeof createRequest>}
   */
  createDirectHttpPostRequest: () =>
    createRequest(
      'POST',
      false,
      process.env.TEST_NODEJS_CONTAINER_HOST,
      process.env.TEST_APP_NODEJS_SERVER_PORT,
      '',
      {},
      true,
    ),

  /**
   * Create a HTTP GET request directly to NodeJS server.
   * @param {string} path
   * @param {any} customHeaders
   * @param {boolean} botUserAgent
   * @returns {ReturnType<typeof createRequest>}
   */
  createDirectHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_NODEJS_CONTAINER_HOST,
      process.env.TEST_APP_NODEJS_SERVER_PORT,
      path,
      customHeaders,
      botUserAgent,
    ),

  /**
   * Create a HTTP GET request to Nginx hostname that does
   * not evaluate whether it should proxy to Prerenderer.
   * @param {string} path
   * @param {any} customHeaders
   * @param {boolean} botUserAgent
   * @returns {ReturnType<typeof createRequest>}
   */
  createDumbProxyHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_DUMB_NGINX_CONTAINER_HOST,
      80,
      path,
      customHeaders,
      botUserAgent,
    ),

  /**
   * Create a HTTP GET request to Nginx hostname that
   * evaluates whether it should proxy to Prerenderer.
   * @param {string} path
   * @param {any} customHeaders
   * @param {boolean} botUserAgent
   * @returns {ReturnType<typeof createRequest>}
   */
  createSmartProxyHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_SMART_NGINX_CONTAINER_HOST,
      80,
      path,
      customHeaders,
      botUserAgent,
    ),

  /**
   * Returns whether request passed through dumb Nginx's proxy.
   * If it returns false, it passed through smart Nginx's proxy.
   * @param {import('http').IncomingMessage} request
   * @returns {boolean}
   */
  requestPassedThroughDumbProxy: (request) => getHeader(request, 'x-proxy-mode') === 'dumb',

  /**
   * Returns whether request passed through smart Nginx's proxy.
   * If it returns false, it passed through dumb Nginx's proxy.
   * @param {import('http').IncomingMessage} request
   * @returns {boolean}
   */
  requestPassedThroughSmartProxy: (request) => getHeader(request, 'x-proxy-mode') === 'smart',

  /**
   * Returns whether request passed through smart Nginx's
   * proxy and it decided to proxy to Prerenderer.
   * @param {import('http').IncomingMessage} request
   * @returns {boolean}
   */
  requestSmartProxyDecidedToPrerender: (request) =>
    getHeader(request, 'x-proxy-should-prerender') === '1',
};
