const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists, existsSync } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/prerenderer');

describe('valid env vars', () => {
  /**
   * @type {import('../../../dist/types/Config').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should use process.env config when no config is given.', async () => {
    const p = new Prerenderer();
    await p.initialize();

    const prerendererLogFile = join(
      process.cwd(),
      process.env.PRERENDERER_LOG_FILE,
    );
    const snapshotsDirectory = join(
      process.cwd(),
      process.env.SNAPSHOTS_DIRECTORY,
    );

    assert.equal(p.getConfig().getPrerendererLogFile(), prerendererLogFile);
    assert.equal(p.getConfig().getSnapshotsDirectory(), snapshotsDirectory);
    assert.equal(
      p.getConfig().getSnapshotsDriver(),
      process.env.SNAPSHOTS_DRIVER,
    );
    assert.equal(
      p.getConfig().isProductionEnv(),
      process.env.NODE_ENV === 'production',
    );
  });

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

    assert.equal(
      p.getConfig().getSnapshotsDirectory(),
      config.snapshotsDirectory,
    );
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
      prerendererLogFile: join(
        process.cwd(),
        'test',
        'tmp',
        `${uuidv4()}.log`,
      ),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.equal(
      p.getConfig().getPrerendererLogFile(),
      config.prerendererLogFile,
    );
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
});
