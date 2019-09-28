const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createSmartApacheProxyHttpGetRequest,
  requestSmartProxyDecidedToPrerender,
  requestPassedThroughSmartProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind smart Apache proxy', () => {
  it('should pass through smart Apache proxy with bot user agent.', async () => {
    const { request, context } = await createSmartApacheProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughSmartProxy(request));
    assert.equal(context, 'prerender');
  });

  it('should pass through smart Apache proxy with non-bot user agent.', async () => {
    const { request, context } = await createSmartApacheProxyHttpGetRequest(
      'index.html',
      {},
      false,
    );
    assert.isTrue(requestPassedThroughSmartProxy(request));
    assert.equal(context, 'static');
  });

  it('should pass through smart Apache proxy and prerender.', async () => {
    const { request, response, context } = await createSmartApacheProxyHttpGetRequest('index.html');
    assert.isTrue(requestSmartProxyDecidedToPrerender(request));
    assert.equal(context, 'prerender');

    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through smart Apache proxy and not prerender because of user-agent.', async () => {
    const { request, context } = await createSmartApacheProxyHttpGetRequest(
      'index.html',
      {},
      false,
    );
    assert.isFalse(requestSmartProxyDecidedToPrerender(request));
    assert.equal(context, 'static');
  });

  it('should pass through smart Apache proxy and not prerender because of extension.', async () => {
    const { request, context } = await createSmartApacheProxyHttpGetRequest('pixel.png');
    assert.isFalse(requestSmartProxyDecidedToPrerender(request));
    assert.equal(context, 'static');
  });
});
