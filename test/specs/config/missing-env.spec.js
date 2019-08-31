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
    NODE_ENV: 'development',
    PRERENDERER_LOG_FILE: join('test', 'tmp', `${uuidv4()}.log`),
    SNAPSHOTS_DIRECTORY: join('test', 'tmp', uuidv4()),
    SNAPSHOTS_DRIVER: 'fs',
  };

  it('should throw an error when NODE_ENV is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      NODE_ENV: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'NODE_ENV');
    }
  });

  it('should throw an error when SNAPSHOTS_DIRECTORY is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      SNAPSHOTS_DIRECTORY: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'SNAPSHOTS_DIRECTORY');
    }
  });

  it('should throw an error when SNAPSHOTS_DRIVER is not set.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      SNAPSHOTS_DRIVER: null,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MissingEnvException);
      assert.include(e.message, 'SNAPSHOTS_DRIVER');
    }
  });
});
