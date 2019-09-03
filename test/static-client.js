const { request } = require('http');
const { v4: uuidv4 } = require('uuid');

const { requests } = require('./static-server');

const { DEFAULT_BOT_USER_AGENTS } = require('../dist/lib/config/defaults');

const defaultOptions = {
  protocol: 'http:',
  port: process.env.TEST_STATIC_SERVER_PORT,
  host: 'localhost',
  headers: {
    Connection: 'keep-alive',
    Pragma: 'no-cache',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=1,*/*',
    'Cache-Control': 'no-cache',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US',
    'User-Agent': 'Mozilla/5.0',
  },
};

/**
 * @param {string} method
 * @param {string} path
 * @param {any} customHeaders
 * @param {boolean} botUserAgent
 * @returns {Promise<import('express').Request>}
 */
const createRequest = (method, path = '/', customHeaders = {}, botUserAgent = false) => {
  /**
   * Create random request id.
   */
  const id = uuidv4();

  const headers = {
    ...defaultOptions.headers,
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
        ...defaultOptions,
        headers,
        path,
        method,
      },
      () => {
        /**
         * When receiving response, resolve promise from request that the server received.
         */
        const request = requests.get(id);
        resolve(request);
      },
    ).end();
  });
};

/**
 * @param {string} path
 * @param {any} customHeaders
 * @param {boolean} botUserAgent
 * @returns {Promise<import('express').Request>}
 */
const createGetRequest = (path = '/', customHeaders = {}, botUserAgent = false) =>
  createRequest('GET', path, customHeaders, botUserAgent);

/**
 * @param {string} path
 * @param {any} customHeaders
 * @param {boolean} botUserAgent
 * @returns {Promise<import('express').Request>}
 */
const createPostRequest = (path = '/', customHeaders = {}, botUserAgent = false) =>
  createRequest('POST', path, customHeaders, botUserAgent);

module.exports = { createGetRequest, createPostRequest };
