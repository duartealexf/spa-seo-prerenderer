const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createSmartProxyHttpGetRequest,
  requestSmartProxyDecidedToPrerender,
  requestPassedThroughSmartProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind smart Nginx proxy', () => {
  it('should pass through smart proxy with bot user agent.', async () => {
    const { request } = await createSmartProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughSmartProxy(request));
  });
  // TODO: add context test

  it('should pass through smart proxy with non-bot user agent.', async () => {
    const { request } = await createSmartProxyHttpGetRequest('index.html', {}, false);
    assert.isTrue(requestPassedThroughSmartProxy(request));
  });

  it('should pass through smart proxy and prerender.', async () => {
    const { request, response } = await createSmartProxyHttpGetRequest('index.html');
    assert.isTrue(requestSmartProxyDecidedToPrerender(request));

    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through smart proxy and not prerender.', async () => {
    const { request } = await createSmartProxyHttpGetRequest('index.html', {}, false);
    assert.isFalse(requestSmartProxyDecidedToPrerender(request));
  });
});
