const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists, existsSync } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/Prerenderer');

describe('valid env vars', () => {
  /**
   * @type {import('../../../dist/types/Config').PrerendererConfigParams}
   */
  const initialConfig = {
    NODE_ENV: 'development',
    PRERENDERER_LOG_FILE: join('test', 'tmp', `${uuidv4()}.log`),
    SNAPSHOTS_DIRECTORY: join('test', 'tmp', uuidv4()),
    SNAPSHOTS_DRIVER: 'fs',
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

  it('should set an absolute path for SNAPSHOTS_DIRECTORY, from a relative directory.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    assert.equal(
      p.getConfig().getSnapshotsDirectory(),
      join(process.cwd(), initialConfig.SNAPSHOTS_DIRECTORY),
    );
  });

  it('should keep an absolute path for SNAPSHOTS_DIRECTORY, from an absolute directory.', async () => {
    const config = Object.assign({}, initialConfig, {
      SNAPSHOTS_DIRECTORY: join(process.cwd(), 'test', 'tmp', uuidv4()),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.equal(
      p.getConfig().getSnapshotsDirectory(),
      config.SNAPSHOTS_DIRECTORY,
    );
  });

  it('should create a directory for SNAPSHOTS_DIRECTORY.', async () => {
    const config = Object.assign({}, initialConfig, {
      SNAPSHOTS_DIRECTORY: join('test', 'tmp', uuidv4()),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should not create a directory for SNAPSHOTS_DIRECTORY when SNAPSHOTS_DRIVER is s3.', async () => {
    const config = Object.assign({}, initialConfig, {
      SNAPSHOTS_DIRECTORY: join('test', 'tmp', uuidv4()),
      SNAPSHOTS_DRIVER: 's3',
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isNotOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should set an absolute path for PRERENDERER_LOG_FILE, from a relative directory.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    assert.equal(
      p.getConfig().getPrerendererLogFile(),
      join(process.cwd(), initialConfig.PRERENDERER_LOG_FILE),
    );
  });

  it('should keep an absolute path for PRERENDERER_LOG_FILE, from an absolute directory.', async () => {
    const config = Object.assign({}, initialConfig, {
      PRERENDERER_LOG_FILE: join(
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
      config.PRERENDERER_LOG_FILE,
    );
  });

  it('should create a log file when PRERENDERER_LOG_FILE is set.', async () => {
    const config = Object.assign({}, initialConfig, {
      PRERENDERER_LOG_FILE: join('test', 'tmp', `${uuidv4()}.log`),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isOk(existsSync(p.getConfig().getPrerendererLogFile()));
  });

  it('should not create a log file when PRERENDERER_LOG_FILE is not set.', async () => {
    const config = Object.assign({}, initialConfig, {
      PRERENDERER_LOG_FILE: undefined,
    });

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isNotOk(await pathExists(p.getConfig().getPrerendererLogFile()));
  });
});
