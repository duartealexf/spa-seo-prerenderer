const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { createDirectHttpGetRequest, createDirectHttpPostRequest } = require('../../../client');
const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('whether it should prerender', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    timeout: 8640000,
  };

  const prerenderer = new Prerenderer(initialConfig);

  before(async () => {
    await prerenderer.initialize();
  });

  /**
   * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
   */
  let reasonToRejectLastPrerender;

  it('should not prerender if there is no request.', async () => {
    assert.isNotOk(prerenderer.shouldPrerender(null));

    reasonToRejectLastPrerender = 'no-request';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if request is not an incoming message.', async () => {
    // @ts-ignore
    assert.isNotOk(prerenderer.shouldPrerender(123));

    reasonToRejectLastPrerender = 'rejected-request';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a GET request.', async () => {
    const { request } = await createDirectHttpPostRequest();
    assert.isNotOk(prerenderer.shouldPrerender(request));

    reasonToRejectLastPrerender = 'rejected-method';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if has empty user agent.', async () => {
    const { request } = await createDirectHttpGetRequest('', { 'user-agent': '' }, false);
    assert.isNotOk(prerenderer.shouldPrerender(request));

    reasonToRejectLastPrerender = 'no-user-agent';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a bot user agent.', async () => {
    const { request } = await createDirectHttpGetRequest('', {}, false);
    assert.isNotOk(prerenderer.shouldPrerender(request));

    reasonToRejectLastPrerender = 'rejected-user-agent';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a prerenderable extension.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      prerenderableExtensions: ['', '.html'],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    const { request } = await createDirectHttpGetRequest('/pixel.png');
    assert.isNotOk(p.shouldPrerender(request));

    reasonToRejectLastPrerender = 'rejected-extension';
    assert.equal(p.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a prerenderable path.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      prerenderablePathRegExps: [/nonexistingpath/],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    const { request } = await createDirectHttpGetRequest('/');
    assert.isNotOk(p.shouldPrerender(request));

    reasonToRejectLastPrerender = 'rejected-path';
    assert.equal(p.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });
});
