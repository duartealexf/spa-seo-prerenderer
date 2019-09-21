const { createGunzip } = require('zlib');

class ClientResponse {
  /**
   * @param {string} url
   * @param {string} body
   * @param {import('http').IncomingHttpHeaders} headers
   * @param {number} statusCode
   */
  constructor(url, body, headers, statusCode) {
    /**
     * @type {string}
     */
    this.url = url;

    /**
     * @type {string}
     */
    this.body = body;

    /**
     * @type {import('http').IncomingHttpHeaders}
     */
    this.headers = headers;

    /**
     * @type {number}
     */
    this.statusCode = statusCode;
  }
}

/**
 * @param {import('http').IncomingMessage} response
 */
ClientResponse.fromResponse = async (response) => {
  const body = await new Promise((resolve) => {
    const isGzipped = getHeader(response, 'content-encoding') === 'gzip';
    const stream = isGzipped ? response.pipe(createGunzip()) : response;
    const buffer = [];

    stream
      .on('data', (/** @type {Buffer} */ chunk) => {
        buffer.push(chunk.toString('utf-8'));
      })
      .on('end', () => {
        resolve(buffer.join(''));
      });
  });

  /**
   * End socket to avoid open handles on NodeJS.
   */
  response.socket.end();

  const headers = response.headers;
  const url = response.url;
  const statusCode = response.statusCode;

  return new ClientResponse(url, body, headers, statusCode);
};

/**
 * Get header from given request/response.
 * @param {import('http').IncomingMessage | ClientResponse} requestOrResponse
 * @param {string} header
 * @returns {string}
 */
const getHeader = (requestOrResponse, header) => {
  const headerEntry = Object.entries(requestOrResponse.headers).find(
    ([k]) => k.toLowerCase() === header,
  );

  if (!headerEntry) {
    return '';
  }

  // @ts-ignore
  return headerEntry[1];
};

module.exports = {
  ClientResponse,
  getHeader,
};
