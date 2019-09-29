const { describe, it } = require('mocha');
const { assert } = require('chai');

const {
  createSmartNginxProxyHttpGetRequest,
  requestPassedThroughSmartProxy,
} = require('../../../client');

describe('prerender requests to NodeJS behind smart Nginx proxy', () => {
  it('should pass through smart Nginx proxy with bot user agent.', async () => {
    const { request, context } = await createSmartNginxProxyHttpGetRequest('index.html');
    assert.isTrue(requestPassedThroughSmartProxy(request));
    assert.equal(context, 'prerender');
  });

  it('should pass through smart Nginx proxy with non-bot user agent.', async () => {
    const { request, context } = await createSmartNginxProxyHttpGetRequest('index.html', {}, false);
    assert.isTrue(requestPassedThroughSmartProxy(request));
    assert.equal(context, 'static');
  });

  it('should pass through smart Nginx proxy and not prerender because of user-agent.', async () => {
    const { context } = await createSmartNginxProxyHttpGetRequest('index.html', {}, false);
    assert.equal(context, 'static');
  });

  it('should pass through smart Apache proxy and not prerender because of extension.', async () => {
    const { context } = await createSmartNginxProxyHttpGetRequest('pixel.png');
    assert.equal(context, 'static');
  });
});
