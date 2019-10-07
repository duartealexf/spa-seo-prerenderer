const { describe, it } = require('mocha');
const { assert } = require('chai');

const { createDirectHttpsGetRequest } = require('../../../client');
const { parseRequestURL } = require('../../../../dist/lib/request');

describe("prerenderer's URL parser using https, without X-Forwarded-* headers.", () => {
  /**
   * @type {import('http').IncomingMessage}
   */
  let request;

  /**
   * @type {import('url').URL}
   */
  let parsedUrl;

  const requestUri = 'index.html?letters=abc&numbers=123&space=%50#fragment';
  const host = process.env.TEST_NODEJS_CONTAINER_HOST;
  const port = process.env.TEST_APP_NODEJS_SERVER_PORT_SECURE;

  before(async () => {
    const clientRequestInfo = await createDirectHttpsGetRequest(requestUri);
    request = clientRequestInfo.request;
    parsedUrl = parseRequestURL(request);
  });

  it('should correctly parse hostname and port.', async () => {
    assert.equal(parsedUrl.host, `${host}:${port}`);
  });

  it('should correctly parse protocol.', async () => {
    assert.equal(parsedUrl.protocol, 'https:');
  });

  it('should correctly parse pathname.', async () => {
    assert.equal(parsedUrl.pathname, '/index.html');
  });

  it('should correctly bring the url back.', async () => {
    const fullUrl = `https://${host}:${port}/${requestUri}`;
    assert.equal(parsedUrl.href, fullUrl);
    assert.equal(parsedUrl.toString(), fullUrl);
  });
});
