const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists, existsSync } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const { DEFAULT_BLACKLISTED_REQUEST_URLS, DEFAULT_BOT_USER_AGENTS, DEFAULT_PRERENDERABLE_EXTENSIONS } = require('../../../../dist/lib/config/defaults');

describe('valid env vars', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should set an absolute path for snapshotsDirectory, from a relative directory.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    assert.equal(
      p.getConfig().getSnapshotsDirectory(),
      join(process.cwd(), initialConfig.snapshotsDirectory),
    );
  });

  it('should keep an absolute path for snapshotsDirectory, from an absolute directory.', async () => {
    const config = Object.assign({}, initialConfig, {
      snapshotsDirectory: join(process.cwd(), 'test', 'tmp', uuidv4()),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.equal(p.getConfig().getSnapshotsDirectory(), config.snapshotsDirectory);
  });

  it('should create a directory for snapshotsDirectory.', async () => {
    const config = Object.assign({}, initialConfig, {
      snapshotsDirectory: join('test', 'tmp', uuidv4()),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should not create a directory for snapshotsDirectory when snapshotsDriver is s3.', async () => {
    const config = Object.assign({}, initialConfig, {
      snapshotsDirectory: join('test', 'tmp', uuidv4()),
      snapshotsDriver: 's3',
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isNotOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should set an absolute path for prerendererLogFile, from a relative directory.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    assert.equal(
      p.getConfig().getPrerendererLogFile(),
      join(process.cwd(), initialConfig.prerendererLogFile),
    );
  });

  it('should keep an absolute path for prerendererLogFile, from an absolute directory.', async () => {
    const config = Object.assign({}, initialConfig, {
      prerendererLogFile: join(process.cwd(), 'test', 'tmp', `${uuidv4()}.log`),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.equal(p.getConfig().getPrerendererLogFile(), config.prerendererLogFile);
  });

  it('should create a log file when prerendererLogFile is set.', async () => {
    const config = Object.assign({}, initialConfig, {
      prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isOk(existsSync(p.getConfig().getPrerendererLogFile()));
  });

  it('should not create a log file when prerendererLogFile is not set.', async () => {
    const config = Object.assign({}, initialConfig, {
      prerendererLogFile: undefined,
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isNotOk(await pathExists(p.getConfig().getPrerendererLogFile()));
  });

  it('should use default config when no config is given.', async () => {
    const p = new Prerenderer();
    await p.initialize();

    const prerendererLogFile = join(process.cwd(), process.env.PRERENDERER_LOG_FILE);
    const snapshotsDirectory = join(process.cwd(), process.env.SNAPSHOTS_DIRECTORY);

    assert.equal(p.getConfig().getPrerendererLogFile(), prerendererLogFile);
    assert.equal(p.getConfig().getSnapshotsDirectory(), snapshotsDirectory);
    assert.equal(p.getConfig().getSnapshotsDriver(), process.env.SNAPSHOTS_DRIVER);
    assert.equal(p.getConfig().isProductionEnv(), process.env.NODE_ENV === 'production');
    assert.deepEqual(p.getConfig().getPrerenderablePathRegExps(), [/.*/]);
    assert.deepEqual(p.getConfig().getPrerenderableExtensions(), DEFAULT_PRERENDERABLE_EXTENSIONS);
    assert.deepEqual(p.getConfig().getBotUserAgents(), DEFAULT_BOT_USER_AGENTS);
    assert.equal(p.getConfig().getTimeout(), 10000);
    assert.deepEqual(p.getConfig().getWhitelistedRequestURLs(), []);
    assert.deepEqual(p.getConfig().getBlacklistedRequestURLs(), DEFAULT_BLACKLISTED_REQUEST_URLS);
  });

  it('should set all configuration as passed to constructor, except for whitelist/blacklist.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      prerenderablePathRegExps: [/test/],
      prerenderableExtensions: ['.test'],
      botUserAgents: ['testbot'],
      timeout: 5000,
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.equal(
      p.getConfig().getPrerenderablePathRegExps()[0].source,
      config.prerenderablePathRegExps[0].source,
    );
  });

  it('should set an empty request URL blacklist when both a blacklist and whitelist config is given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      whitelistedRequestURLs: ['.test-1.'],
      blacklistedRequestURLs: ['.test-2.'],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.deepEqual(
      p.getConfig().getWhitelistedRequestURLs(),
      config.whitelistedRequestURLs
    );

    assert.deepEqual(
      p.getConfig().getBlacklistedRequestURLs(),
      []
    );
  });

  it('should set an empty request URL blacklist when both a whitelist config is given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      whitelistedRequestURLs: ['.test-1.'],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.deepEqual(
      p.getConfig().getWhitelistedRequestURLs(),
      config.whitelistedRequestURLs
    );

    assert.deepEqual(
      p.getConfig().getBlacklistedRequestURLs(),
      []
    );
  });

  it('should set a blacklist request URL when an empty whitelist and a valid blacklist config is given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      blacklistedRequestURLs: ['.test-1.'],
      whitelistedRequestURLs: []
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.deepEqual(
      p.getConfig().getBlacklistedRequestURLs(),
      config.blacklistedRequestURLs
    );

    assert.deepEqual(
      p.getConfig().getWhitelistedRequestURLs(),
      []
    );
  });

  it('should set a blacklist request URL when only a valid blacklist config is given.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      ...initialConfig,
      blacklistedRequestURLs: ['.test-1.'],
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.deepEqual(
      p.getConfig().getBlacklistedRequestURLs(),
      config.blacklistedRequestURLs
    );

    assert.deepEqual(
      p.getConfig().getWhitelistedRequestURLs(),
      []
    );
  });
});
