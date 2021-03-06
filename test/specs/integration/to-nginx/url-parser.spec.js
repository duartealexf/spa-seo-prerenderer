const { describe, it } = require('mocha');
const { assert } = require('chai');

const { createSmartNginxProxyHttpGetRequest } = require('../../../client');
const { parseRequestURL } = require('../../../../dist/lib/request');

describe("prerenderer's URL parser with Nginx's X-Forwarded-* headers.", () => {
  /**
   * @type {import('http').IncomingMessage}
   */
  let request;

  /**
   * @type {import('url').URL}
   */
  let parsedUrl;

  const requestUri = 'index.html?letters=abc&numbers=123&space=%50#fragment';
  const host = process.env.TEST_SMART_NGINX_CONTAINER_HOST;

  before(async () => {
    request = (await createSmartNginxProxyHttpGetRequest(requestUri)).request;
    parsedUrl = parseRequestURL(request);
  });

  it('should correctly parse host.', async () => {
    assert.equal(parsedUrl.host, `${host}`);
  });

  it('should correctly parse protocol.', async () => {
    assert.equal(parsedUrl.protocol, 'http:');
  });

  it('should correctly bring the url back.', async () => {
    const fullUrl = `http://${host}/${requestUri}`;
    assert.equal(parsedUrl.href, fullUrl);
    assert.equal(parsedUrl.toString(), fullUrl);
  });
});
