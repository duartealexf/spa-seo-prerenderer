const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/Prerenderer');
const {
  InvalidEnvException,
} = require('../../../dist/lib/Exceptions/InvalidEnvException');
const {
  MismatchingEnvException,
} = require('../../../dist/lib/Exceptions/MismatchingEnvException');

describe('invalid env vars', () => {
  /**
   * @type {import('../../../dist/types/Config').PrerendererConfigParams}
   */
  const initialConfig = {
    NODE_ENV: 'development',
    PRERENDERER_LOG_FILE: join('test', 'tmp', `${uuidv4()}.log`),
    SNAPSHOTS_DIRECTORY: join('test', 'tmp', uuidv4()),
    SNAPSHOTS_DRIVER: 'fs',
  };

  it('should throw an error when SNAPSHOTS_DRIVER is incorrect.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      SNAPSHOTS_DRIVER: '123456',
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MismatchingEnvException);
      assert.include(e.message, 'SNAPSHOTS_DRIVER');
    }
  });

  it('should throw an error when SNAPSHOTS_DRIVER is not ok for s3.', async () => {
    try {
      const buggedConfig = Object.assign({}, initialConfig, {
        SNAPSHOTS_DIRECTORY: '/test/path',
        SNAPSHOTS_DRIVER: 's3',
      });

      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidEnvException);
      assert.include(e.message, 'SNAPSHOTS_DIRECTORY');
      assert.include(e.message, "when SNAPSHOTS_DRIVER is 's3'");
    }

    try {
      const buggedConfig = Object.assign({}, initialConfig, {
        SNAPSHOTS_DIRECTORY: './test/path',
        SNAPSHOTS_DRIVER: 's3',
      });

      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidEnvException);
      assert.include(e.message, 'SNAPSHOTS_DIRECTORY');
      assert.include(e.message, "when SNAPSHOTS_DRIVER is 's3'");
    }
  });
});
