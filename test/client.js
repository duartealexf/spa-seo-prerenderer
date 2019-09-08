const { request } = require('http');
const { v4: uuidv4 } = require('uuid');

const { requests } = require('./servers/test-app-server');
const { DEFAULT_BOT_USER_AGENTS } = require('../dist/lib/config/defaults');

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
 * @returns {Promise<{request: import('express').Request, response: import('http').IncomingMessage}>}
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
    headers['user-agent'] = DEFAULT_BOT_USER_AGENTS[0];
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
      (response) => {
        /**
         * When receiving response, resolve promise from request that the server received.
         */
        const request = requests.get(id);
        resolve({ request, response });
      },
    ).end();
  });
};

module.exports = {
  /**
   * Create a HTTP POST request directly to NodeJS server. Note that there are not
   * many options to make a post request. This is because we don't need to focus
   * on them as much, as the Prerenderer only create snapshots for GET requests.
   * @returns {Promise<{request: import('express').Request, response: import('http').IncomingMessage}>}
   */
  createDirectHttpPostRequest: () =>
    createRequest(
      'POST',
      false,
      process.env.TEST_NODEJS_SERVERS_HOST,
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
   * @returns {Promise<{request: import('express').Request, response: import('http').IncomingMessage}>}
   */
  createDirectHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_NODEJS_SERVERS_HOST,
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
   * @returns {Promise<{request: import('express').Request, response: import('http').IncomingMessage}>}
   */
  createDumbProxyHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_DUMB_NGINX_SERVER_HOST,
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
   * @returns {Promise<{request: import('express').Request, response: import('http').IncomingMessage}>}
   */
  createSmartProxyHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(
      'GET',
      false,
      process.env.TEST_SMART_NGINX_SERVER_HOST,
      80,
      path,
      customHeaders,
      botUserAgent,
    ),

  /**
   * Returns whether request passed through dumb Nginx's proxy.
   * If it returns false, it passed through smart Nginx's proxy.
   * @param {import('express').Request} request
   */
  requestPassedThroughDumbProxy: (request) => request.header('x-proxy-mode') === 'dumb',

  /**
   * Returns whether request passed through smart Nginx's proxy.
   * If it returns false, it passed through dumb Nginx's proxy.
   * @param {import('express').Request} request
   */
  requestPassedThroughSmartProxy: (request) => request.header('x-proxy-mode') === 'smart',

  /**
   * Returns whether request passed through smart Nginx's
   * proxy and it decided to proxy to Prerenderer.
   * @param {import('express').Request} request
   */
  requestSmartProxyDecidedToPrerender: (request) => request.header('x-proxy-should-prerender') === '1',
};
