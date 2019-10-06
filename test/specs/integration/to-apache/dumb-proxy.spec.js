const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createCommonApacheProxyHttpGetRequest,
  requestPassedThroughCommonProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind common Apache proxy', () => {
  it('should pass through common Apache proxy with bot user agent.', async () => {
    const { request, context } = await createCommonApacheProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughCommonProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through common Apache proxy and follow redirect.', async () => {
    const { response } = await createCommonApacheProxyHttpGetRequest('redirect-index/from.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should pass through common Apache proxy with non-bot user agent.', async () => {
    const { request, context } = await createCommonApacheProxyHttpGetRequest(
      'index.html',
      {},
      false,
    );
    assert.isTrue(requestPassedThroughCommonProxy(request));
    assert.equal(context, 'app');
  });

  it('should pass through common Apache proxy and prerender.', async () => {
    const { response, context } = await createCommonApacheProxyHttpGetRequest('index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
    assert.equal(context, 'app');
  });

  it('should pass through common Apache proxy and not prerender.', async () => {
    const { response, context } = await createCommonApacheProxyHttpGetRequest(
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
