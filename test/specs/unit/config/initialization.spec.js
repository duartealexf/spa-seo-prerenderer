const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const {
  DEFAULT_BLACKLISTED_REQUEST_URLS,
  DEFAULT_BOT_USER_AGENTS,
  DEFAULT_PRERENDERABLE_EXTENSIONS,
} = require('../../../../dist/lib/config/defaults');

describe('config initialization', () => {
  it('should use default config when no config is given.', async () => {
    const p = new Prerenderer();
    const c = p.getConfig();

    assert.isTrue(c.isProductionEnv());
    assert.equal(c.getPrerendererLogFile(), '');
    assert.equal(c.getSnapshotsDirectory(), join(process.cwd(), 'snapshots'));
    assert.equal(c.getFilesystemDriver(), 'fs');
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
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      nodeEnv: 'development',
      prerendererLogFile: join(process.cwd(), 'test', 'tmp', `${uuidv4()}.log`),
      snapshotsDirectory: join(process.cwd(), 'test', 'tmp', uuidv4()),
      filesystemDriver: 's3',
      chromiumExecutable: 'chromium',
      prerenderablePathRegExps: [/test/],
      prerenderableExtensions: ['.test'],
      botUserAgents: ['testbot'],
      timeout: 5000,
      whitelistedRequestURLs: ['.test-1.'],
      blacklistedRequestURLs: ['.test-2.'],
    };

    const p = new Prerenderer(config);
    const c = p.getConfig();

    assert.isFalse(c.isProductionEnv());
    assert.equal(c.getPrerendererLogFile(), config.prerendererLogFile);
    assert.equal(c.getSnapshotsDirectory(), config.snapshotsDirectory);
    assert.equal(c.getFilesystemDriver(), config.filesystemDriver);
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
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      whitelistedRequestURLs: [],
      blacklistedRequestURLs: [],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.deepEqual(p.getConfig().getWhitelistedRequestURLs(), []);
    assert.deepEqual(p.getConfig().getBlacklistedRequestURLs(), []);
  });
});
