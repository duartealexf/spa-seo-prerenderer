const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createDumbApacheProxyHttpGetRequest,
  requestPassedThroughDumbProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind dumb Apache proxy', () => {
  it('should pass through dumb Apache proxy with bot user agent.', async () => {
    const { request, context } = await createDumbApacheProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughDumbProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through dumb Apache proxy and follow redirect.', async () => {
    const { response } = await createDumbApacheProxyHttpGetRequest('redirect-index/from.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through dumb Apache proxy with non-bot user agent.', async () => {
    const { request, context } = await createDumbApacheProxyHttpGetRequest('index.html', {}, false);
    assert.isTrue(requestPassedThroughDumbProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through dumb Apache proxy and prerender.', async () => {
    const { response, context } = await createDumbApacheProxyHttpGetRequest('index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
    assert.equal(context, 'app');
  });

  it('should pass through dumb Apache proxy and not prerender.', async () => {
    const { response, context } = await createDumbApacheProxyHttpGetRequest(
      'index.html',
      {},
      false,
    );
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 0);
    assert.equal($('body').length, 1);
    assert.equal(context, 'app');
  });
});
