const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists, existsSync } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { PrerendererService } = require('../../../../dist/lib/service');

describe('log file config', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
   */
  const initialConfig = {
    databaseOptions: {
      authSource: 'admin',
      host: process.env.TEST_DB_HOST,
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
    },
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
  };

  it('should set an absolute path for prerendererLogFile, from a relative directory.', async () => {
    const p = new PrerendererService(initialConfig);

    assert.equal(
      p.getConfig().getPrerendererLogFile(),
      join(process.cwd(), initialConfig.prerendererLogFile),
    );
  });

  it('should keep an absolute path for prerendererLogFile, from an absolute directory.', async () => {
    const config = {
      ...initialConfig,
      prerendererLogFile: join(process.cwd(), 'test', 'tmp', `${uuidv4()}.log`),
    };

    const p = new PrerendererService(config);

    assert.equal(p.getConfig().getPrerendererLogFile(), config.prerendererLogFile);
  });

  it('should create a log file when prerendererLogFile is set.', async () => {
    const config = { ...initialConfig, prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`) };

    const p = new PrerendererService(config);
    await p.start();

    assert.isOk(existsSync(p.getConfig().getPrerendererLogFile()));
    await p.stop();
  });

  it('should not create a log file when prerendererLogFile is not set.', async () => {
    const config = { ...initialConfig, prerendererLogFile: undefined };

    const p = new PrerendererService(config);
    await p.start();

    assert.isNotOk(await pathExists(p.getConfig().getPrerendererLogFile()));
    await p.stop();
  });
});
