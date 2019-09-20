const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createSmartProxyHttpGetRequest,
  getResponseBody,
  requestSmartProxyDecidedToPrerender,
} = require('../../../client');

describe('prerender requests to NodeJS behind smart Nginx proxy', () => {
  it('should receive prerendered index.html.', async () => {
    const { response } = await createSmartProxyHttpGetRequest('index.html', {}, true);
    const body = await getResponseBody(response);
    const $ = cheerio.load(body);

    assert.equal($('#app').length, 1);
  });

  it('should pass through smart proxy.', async () => {
    const { request } = await createSmartProxyHttpGetRequest('index.html', {}, true);
    assert.isTrue(requestSmartProxyDecidedToPrerender(request));
  });
});
