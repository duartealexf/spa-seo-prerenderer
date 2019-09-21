const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const { createDumbProxyHttpGetRequest, requestPassedThroughDumbProxy } = require('../../../client');

describe('prerender requests to NodeJS behind dumb Nginx proxy', () => {
  it('should pass through dumb proxy with bot user agent.', async () => {
    const { request } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    assert.isTrue(requestPassedThroughDumbProxy(request));
  });
  // TODO: add context test

  it('should pass through dumb proxy with non-bot user agent.', async () => {
    const { request } = await createDumbProxyHttpGetRequest('index.html', {}, false);
    assert.isTrue(requestPassedThroughDumbProxy(request));
  });

  it('should pass through dumb proxy and prerender.', async () => {
    const { response } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through dumb proxy and not prerender.', async () => {
    const { response } = await createDumbProxyHttpGetRequest('index.html', {}, false);
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 0);
    assert.equal($('body').length, 1);
  });
});
