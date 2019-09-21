const { describe, it } = require('mocha');
const { assert } = require('chai');

const { createDirectHttpGetRequest } = require('../../../client');
const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('prerenderer URL parser without X- headers.', () => {
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
  const port = process.env.TEST_APP_NODEJS_SERVER_PORT;

  before(async () => {
    request = (await createDirectHttpGetRequest(requestUri, {}, true)).request;
    parsedUrl = Prerenderer.parseUrl(request);
  });

  it('should correctly parse fragment.', async () => {
    assert.equal(parsedUrl.hash, '#fragment');
  });

  it('should correctly parse hostname and port.', async () => {
    assert.equal(parsedUrl.host, `${host}:${port}`);
  });

  it('should correctly parse protocol.', async () => {
    assert.equal(parsedUrl.protocol, 'http:');
  });

  it('should correctly parse pathname.', async () => {
    assert.equal(parsedUrl.pathname, '/index.html');
  });

  it('should correctly bring the url back.', async () => {
    const fullUrl = `http://${host}:${port}/${requestUri}`;
    assert.equal(parsedUrl.href, fullUrl);
    assert.equal(parsedUrl.toString(), fullUrl);
  });
});
