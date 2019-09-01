const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/Prerenderer');
const {
  MissingEnvException,
} = require('../../../dist/lib/Exceptions/MissingEnvException');

describe('missing env vars', () => {
  /**
   * @type {import('../../../dist/types/Config').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should throw an error when nodeEnv is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      nodeEnv: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'nodeEnv');
    }
  });

  it('should throw an error when snapshotsDirectory is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      snapshotsDirectory: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'snapshotsDirectory');
    }
  });

  it('should throw an error when snapshotsDriver is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      snapshotsDriver: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'snapshotsDriver');
    }
  });
});
