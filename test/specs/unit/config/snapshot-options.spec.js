const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('snapshot options config', () => {
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

    assert.equal(
      p.getConfig().getSnapshotsDirectory(),
      join(process.cwd(), initialConfig.snapshotsDirectory),
    );
  });

  it('should keep an absolute path for snapshotsDirectory, from an absolute directory.', async () => {
    const config = {
      ...initialConfig,
      snapshotsDirectory: join(process.cwd(), 'test', 'tmp', uuidv4()),
    };

    const p = new Prerenderer(config);

    assert.equal(p.getConfig().getSnapshotsDirectory(), config.snapshotsDirectory);
  });

  it('should create a directory for snapshotsDirectory.', async () => {
    const config = { ...initialConfig, snapshotsDirectory: join('test', 'tmp', uuidv4()) };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should not create a directory for snapshotsDirectory when snapshotsDriver is s3.', async () => {
    const config = {
      ...initialConfig,
      snapshotsDirectory: `${join(process.cwd(), 'test', 'tmp', uuidv4())}`,
      snapshotsDriver: 's3',
    };

    const p = new Prerenderer(config);
    await p.initialize();

    assert.isNotOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });
});
