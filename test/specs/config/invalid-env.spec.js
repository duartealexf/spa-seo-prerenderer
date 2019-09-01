const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/prerenderer');
const {
  InvalidConfigException,
} = require('../../../dist/lib/exceptions/invalid-config-exception');
const {
  MismatchingConfigException,
} = require('../../../dist/lib/exceptions/mismatching-config-exception');

describe('invalid env vars', () => {
  /**
   * @type {import('../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should throw an error when snapshotsDriver is incorrect.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      snapshotsDriver: '123456',
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MismatchingConfigException);
      assert.include(e.message, 'snapshotsDriver');
    }
  });

  it('should throw an error when snapshotsDriver is not ok for s3.', async () => {
    try {
      const buggedConfig = Object.assign({}, initialConfig, {
        snapshotsDirectory: '/test/path',
        snapshotsDriver: 's3',
      });

      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'snapshotsDirectory');
      assert.include(e.message, "when snapshotsDriver is 's3'");
    }

    try {
      const buggedConfig = Object.assign({}, initialConfig, {
        snapshotsDirectory: './test/path',
        snapshotsDriver: 's3',
      });

      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'snapshotsDirectory');
      assert.include(e.message, "when snapshotsDriver is 's3'");
    }
  });
});
