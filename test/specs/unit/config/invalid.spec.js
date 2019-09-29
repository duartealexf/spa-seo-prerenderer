const { describe, it } = require('mocha');
const { assert } = require('chai');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const {
  InvalidConfigException,
} = require('../../../../dist/lib/exceptions/invalid-config-exception');
const {
  MismatchingConfigException,
} = require('../../../../dist/lib/exceptions/mismatching-config-exception');

describe('invalid config', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  let buggedConfig = {};

  it('should throw an error when nodeEnv is not a string.', () => {
    // @ts-ignore
    buggedConfig = { nodeEnv: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'nodeEnv');
    }
  });

  it('should throw an error when filesystemDriver is invalid.', () => {
    // @ts-ignore
    buggedConfig = { filesystemDriver: 'xyz' };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MismatchingConfigException);
      assert.include(e.message, 'filesystemDriver');
    }
  });

  it('should throw an error when filesystemDriver is not a string.', () => {
    // @ts-ignore
    buggedConfig = { filesystemDriver: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, MismatchingConfigException);
      assert.include(e.message, 'filesystemDriver');
    }
  });

  it('should throw an error when snapshotsDirectory is not a string.', () => {
    // @ts-ignore
    buggedConfig = { snapshotsDirectory: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'snapshotsDirectory');
    }
  });

  it('should throw an error when snapshotsDirectory is s3 and snapshotsDirectory does not start with "/".', () => {
    // @ts-ignore
    buggedConfig = { snapshotsDirectory: 'test/directory', filesystemDriver: 's3' };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'snapshotsDirectory');
      assert.include(e.message, 'filesystemDriver');
    }
  });

  it('should throw an error when prerendererLogFile is not a string.', () => {
    // @ts-ignore
    buggedConfig = { prerendererLogFile: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerendererLogFile');
    }
  });

  it('should throw an error when prerenderablePathRegExps is not an array.', () => {
    // @ts-ignore
    buggedConfig = { prerenderablePathRegExps: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderablePathRegExps is not RegExp[].', () => {
    // @ts-ignore
    buggedConfig = { prerenderablePathRegExps: [123] };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderableExtensions is not an array.', () => {
    // @ts-ignore
    buggedConfig = { prerenderableExtensions: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when prerenderableExtensions is not string[].', () => {
    // @ts-ignore
    buggedConfig = { prerenderableExtensions: [123] };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when botUserAgents is not an array.', () => {
    // @ts-ignore
    buggedConfig = { botUserAgents: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when botUserAgents is not string[].', () => {
    // @ts-ignore
    buggedConfig = { botUserAgents: [123] };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when timeout is not a number.', () => {
    // @ts-ignore
    buggedConfig = { timeout: 'abc' };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is equal to zero.', () => {
    buggedConfig = { timeout: 0 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is less than zero.', () => {
    buggedConfig = { timeout: -50 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when whitelistedRequestURLs is not an array.', () => {
    // @ts-ignore
    buggedConfig = { whitelistedRequestURLs: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'whitelistedRequestURLs');
    }
  });

  it('should throw an error when whitelistedRequestURLs is not string[].', () => {
    // @ts-ignore
    buggedConfig = { whitelistedRequestURLs: [123] };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'whitelistedRequestURLs');
    }
  });

  it('should throw an error when blacklistedRequestURLs is not an array.', () => {
    // @ts-ignore
    buggedConfig = { blacklistedRequestURLs: 123 };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'blacklistedRequestURLs');
    }
  });

  it('should throw an error when blacklistedRequestURLs is not string[].', () => {
    // @ts-ignore
    buggedConfig = { blacklistedRequestURLs: [123] };

    try {
      new Prerenderer(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'blacklistedRequestURLs');
    }
  });
});
