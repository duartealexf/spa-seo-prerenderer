const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { PrerendererService } = require('../../../../dist/lib/service');
const {
  DEFAULT_BLACKLISTED_REQUEST_URLS,
  DEFAULT_BOT_USER_AGENTS,
  DEFAULT_PRERENDERABLE_EXTENSIONS,
} = require('../../../../dist/lib/config/defaults');

require('../../hooks.spec');

describe('config start up', () => {
  it('should use default config when no config is given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
     */
    const config = {
      databaseOptions: {
        authSource: 'admin',
        host: process.env.TEST_DB_HOST,
        username: process.env.TEST_DB_USERNAME,
      },
    };

    const p = new PrerendererService(config);
    const c = p.getConfig();

    assert.isTrue(c.isProductionEnv());
    assert.equal(c.getPrerendererLogFile(), '');
    assert.equal(c.getChromiumExecutable(), '');
    assert.deepEqual(c.getPrerenderablePathRegExps(), [/.*/]);
    assert.deepEqual(c.getPrerenderableExtensions(), DEFAULT_PRERENDERABLE_EXTENSIONS);
    assert.deepEqual(c.getBotUserAgents(), DEFAULT_BOT_USER_AGENTS);
    assert.equal(c.getTimeout(), 10000);
    assert.deepEqual(c.getWhitelistedRequestURLs(), []);
    assert.deepEqual(c.getBlacklistedRequestURLs(), DEFAULT_BLACKLISTED_REQUEST_URLS);
  });

  it('should set all configuration as passed to constructor.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
     */
    const config = {
      nodeEnv: 'development',
      databaseOptions: {
        authSource: 'admin',
        host: process.env.TEST_DB_HOST,
        username: process.env.TEST_DB_USERNAME,
      },
      prerendererLogFile: join(process.cwd(), 'test', 'tmp', `${uuidv4()}.log`),
      chromiumExecutable: 'chromium',
      prerenderablePathRegExps: [/test/],
      prerenderableExtensions: ['.test'],
      botUserAgents: ['testbot'],
      timeout: 5000,
      whitelistedRequestURLs: ['.test-1.'],
      blacklistedRequestURLs: ['.test-2.'],
    };

    const p = new PrerendererService(config);
    const c = p.getConfig();

    assert.isFalse(c.isProductionEnv());
    assert.deepEqual(c.getDatabaseOptions(), config.databaseOptions);
    assert.equal(c.getPrerendererLogFile(), config.prerendererLogFile);
    assert.equal(c.getChromiumExecutable(), config.chromiumExecutable);
    assert.equal(
      c.getPrerenderablePathRegExps()[0].source,
      config.prerenderablePathRegExps[0].source,
    );
    assert.equal(c.getPrerenderableExtensions()[0], config.prerenderableExtensions[0]);
    assert.equal(c.getBotUserAgents()[0], config.botUserAgents[0]);
    assert.equal(c.getTimeout(), config.timeout);
    assert.deepEqual(c.getWhitelistedRequestURLs(), config.whitelistedRequestURLs);
    assert.deepEqual(c.getBlacklistedRequestURLs(), config.blacklistedRequestURLs);
  });

  it('should set empty whitelist and blacklist when empty arrays are given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
     */
    const config = {
      databaseOptions: {
        username: process.env.TEST_DB_USERNAME,
        authSource: 'admin',
      },
      whitelistedRequestURLs: [],
      blacklistedRequestURLs: [],
    };

    const p = new PrerendererService(config);
    assert.deepEqual(p.getConfig().getWhitelistedRequestURLs(), []);
    assert.deepEqual(p.getConfig().getBlacklistedRequestURLs(), []);
  });
});
