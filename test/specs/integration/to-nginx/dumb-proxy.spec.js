const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createDumbNginxProxyHttpGetRequest,
  requestPassedThroughDumbProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind dumb Nginx proxy', () => {
  it('should pass through dumb Nginx proxy with bot user agent.', async () => {
    const { request, context } = await createDumbNginxProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughDumbProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through dumb Nginx proxy and follow redirect.', async () => {
    const { response } = await createDumbNginxProxyHttpGetRequest('redirect-index/from.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through dumb Nginx proxy with non-bot user agent.', async () => {
    const { request, context } = await createDumbNginxProxyHttpGetRequest('index.html', {}, false);
    assert.isTrue(requestPassedThroughDumbProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through dumb Nginx proxy and prerender.', async () => {
    const { response, context } = await createDumbNginxProxyHttpGetRequest('index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
    assert.equal(context, 'app');
  });

  it('should pass through dumb Nginx proxy and not prerender.', async () => {
    const { response, context } = await createDumbNginxProxyHttpGetRequest('index.html', {}, false);
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 0);
    assert.equal($('body').length, 1);
    assert.equal(context, 'app');
  });
});
