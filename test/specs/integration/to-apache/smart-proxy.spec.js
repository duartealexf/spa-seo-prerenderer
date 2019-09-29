const { describe, it } = require('mocha');
const { assert } = require('chai');

require('../../hooks.spec');

const {
  createSmartApacheProxyHttpGetRequest,
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

  it('should pass through smart Apache proxy and not prerender because of user-agent.', async () => {
    const { context } = await createSmartApacheProxyHttpGetRequest('index.html', {}, false);
    assert.equal(context, 'static');
  });

  it('should pass through smart Apache proxy and not prerender because of extension.', async () => {
    const { context } = await createSmartApacheProxyHttpGetRequest('pixel.png');
    assert.equal(context, 'static');
  });
});
