const { describe, it, before } = require('mocha');
const { assert } = require('chai');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const { Logger } = require('../../../../dist/lib/logger');
const { Config } = require('../../../../dist/lib/config');

describe('prerenderer property checks after initialization', async () => {
  const prerenderer = new Prerenderer();

  before(async () => {
    await prerenderer.initialize();
  });

  it('logger should be a Logger instance.', async () => {
    assert.instanceOf(prerenderer.getLogger(), Logger);
  });

  it('config should be a Config instance.', async () => {
    assert.instanceOf(prerenderer.getConfig(), Config);
  });
});
