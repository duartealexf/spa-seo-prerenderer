const { request } = require('http');
const { v4: uuidv4 } = require('uuid');

const { requests } = require('./static-server');
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
 * @param {boolean} isSecure
 * @param {string} method
 * @param {boolean} isProxy
 * @param {string} path
 * @param {any} customHeaders
 * @param {boolean} botUserAgent
 * @returns {Promise<{request: import('express').Request, response: import('express').Response}>}
 */
const createRequest = (isSecure, method, isProxy, path, customHeaders, botUserAgent) => {
  /**
   * Create random request id.
   */
  const id = uuidv4();

  let requestPath;
  let host;

  if (isProxy) {
    requestPath = `/${process.env.TEST_NODEJS_PROXY_PATH}/${trimSlashes(path)}`;
    host = process.env.TEST_NGINX_SERVER_HOST;
  } else {
    requestPath = `/${trimSlashes(path)}`;
    host = process.env.TEST_NODEJS_SERVER_HOST;
  }

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
        protocol: isSecure ? 'https:' : 'http:',
        path: requestPath,
        host,
        headers,
        method,
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
   * Create a HTTP GET request directly to NodeJS server.
   * @param {string} path
   * @param {any} customHeaders
   * @param {boolean} botUserAgent
   * @returns {Promise<{request: import('express').Request, response: import('express').Response}>}
   */
  createDirectHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(false, 'GET', false, path, customHeaders, botUserAgent),

  /**
   * Create a HTTP GET request to NodeJS server behind a Nginx proxy.
   * @param {string} path
   * @param {any} customHeaders
   * @param {boolean} botUserAgent
   * @returns {Promise<{request: import('express').Request, response: import('express').Response}>}
   */
  createProxyHttpGetRequest: (path = '', customHeaders = {}, botUserAgent = true) =>
    createRequest(false, 'GET', true, path, customHeaders, botUserAgent),

  /**
   * Create a HTTP POST request directly to NodeJS server. Note that there are not
   * many options to make a post request. This is because we don't need to focus
   * on them as much, as the Prerenderer only create snapshots for GET requests.
   * @returns {Promise<{request: import('express').Request, response: import('express').Response}>}
   */
  createDirectHttpPostRequest: () => createRequest(false, 'POST', false, '', {}, true),
};
