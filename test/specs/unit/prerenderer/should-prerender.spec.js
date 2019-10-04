const { describe, it, before, after } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { createDirectHttpGetRequest, createDirectHttpPostRequest } = require('../../../client');
const { PrerendererService } = require('../../../../dist/lib/service');

describe('whether it should prerender', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
   */
  const initialConfig = {
    nodeEnv: 'development',
    databaseOptions: {
      authSource: 'admin',
      host: process.env.TEST_DB_HOST,
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
    },
    timeout: 8640000,
  };

  const service = new PrerendererService(initialConfig);
  const prerenderer = service.getPrerenderer();

  before(() => service.start());
  after(() => service.stop());

  it('should not prerender if there is no request.', async () => {
    assert.isNotOk(prerenderer.shouldPrerender(null));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'no-request';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if request is not an incoming message.', async () => {
    // @ts-ignore
    assert.isNotOk(prerenderer.shouldPrerender(123));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'rejected-request';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a GET request.', async () => {
    const { request } = await createDirectHttpPostRequest();
    assert.isNotOk(prerenderer.shouldPrerender(request));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'rejected-method';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if has empty user agent.', async () => {
    const { request } = await createDirectHttpGetRequest('', { 'user-agent': '' }, false);
    assert.isNotOk(prerenderer.shouldPrerender(request));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'no-user-agent';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a bot user agent.', async () => {
    const { request } = await createDirectHttpGetRequest('', {}, false);
    assert.isNotOk(prerenderer.shouldPrerender(request));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'rejected-user-agent';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a prerenderable extension.', async () => {
    const { request } = await createDirectHttpGetRequest('/pixel.png');
    assert.isNotOk(prerenderer.shouldPrerender(request));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'rejected-extension';
    assert.equal(prerenderer.getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
  });

  it('should not prerender if it is not a prerenderable path.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
     */
    const config = {
      ...initialConfig,
      prerenderablePathRegExps: [/nonexistingpath/],
    };

    const p = new PrerendererService(config);
    await p.start();

    const { request } = await createDirectHttpGetRequest('/');
    assert.isNotOk(p.getPrerenderer().shouldPrerender(request));

    /**
     * @type {import('../../../../dist/types/prerenderer').ReasonsToRejectPrerender}
     */
    const reasonToRejectLastPrerender = 'rejected-path';
    assert.equal(p.getPrerenderer().getLastRejectedPrerenderReason(), reasonToRejectLastPrerender);
    await p.stop();
  });
});
