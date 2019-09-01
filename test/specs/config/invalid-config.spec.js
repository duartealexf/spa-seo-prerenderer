const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/prerenderer');
const { InvalidConfigException } = require('../../../dist/lib/exceptions/invalid-config-exception');

describe('invalid config', () => {
  /**
   * @type {import('../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should throw an error when prerenderablePathRegExps is not an array.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      prerenderablePathRegExps: 123,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderablePathRegExps is not RegExp[].', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      prerenderablePathRegExps: [123],
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderableExtensions is not an array.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      prerenderableExtensions: 123,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when prerenderableExtensions is not string[].', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      prerenderableExtensions: [123],
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when botUserAgents is not an array.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      botUserAgents: 123,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when botUserAgents is not string[].', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      botUserAgents: [123],
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when timeout is not a number.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      timeout: 'abc',
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is equal to zero.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      timeout: 0,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is less than zero.', async () => {
    const buggedConfig = Object.assign({}, initialConfig, {
      timeout: -50,
    });

    try {
      const p = new Prerenderer(buggedConfig);
      await p.initialize();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });
});
