const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createDumbProxyHttpGetRequest,
  getResponseBody,
  requestSmartProxyDecidedToPrerender,
} = require('../../../client');

describe('prerender requests to NodeJS behind dumb Nginx proxy', () => {
  it('should receive prerendered index.html.', async () => {
    const { response } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    const body = await getResponseBody(response);
    const $ = cheerio.load(body);

    assert.equal($('#app').length, 1);
  });

  it('should pass through dumb proxy.', async () => {
    const { request } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    assert.isFalse(requestSmartProxyDecidedToPrerender(request));
  });
});
