const { describe, it } = require('mocha');
const { assert } = require('chai');

const { PrerendererService } = require('../../../../dist/lib/service');
const {
  InvalidConfigException,
} = require('../../../../dist/lib/exceptions/invalid-config-exception');

describe('invalid config', () => {
  let buggedConfig = {};
  const databaseOptions = {
    authSource: 'admin',
    username: process.env.TEST_DB_USERNAME,
  };

  it('should throw an error when nodeEnv is not a string.', () => {
    buggedConfig = { nodeEnv: 123 };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'nodeEnv');
    }
  });

  it('should throw an error when databaseOptions is not an object.', () => {
    buggedConfig = {};

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'databaseOptions');
      assert.include(e.message, 'must be an object');
    }
  });

  it('should throw an error when databaseOptions is an empty object.', () => {
    buggedConfig = { databaseOptions: {} };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'databaseOptions');
      assert.include(e.message, 'must contain database credentials');
    }
  });

  it('should throw an error when prerendererLogFile is not a string.', () => {
    buggedConfig = { prerendererLogFile: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerendererLogFile');
    }
  });

  it('should throw an error when prerenderablePathRegExps is not an array.', () => {
    buggedConfig = { prerenderablePathRegExps: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderablePathRegExps is not RegExp[].', () => {
    buggedConfig = { prerenderablePathRegExps: [123], databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderablePathRegExps');
    }
  });

  it('should throw an error when prerenderableExtensions is not an array.', () => {
    buggedConfig = { prerenderableExtensions: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when prerenderableExtensions is not string[].', () => {
    buggedConfig = { prerenderableExtensions: [123], databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'prerenderableExtensions');
    }
  });

  it('should throw an error when botUserAgents is not an array.', () => {
    buggedConfig = { botUserAgents: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when botUserAgents is not string[].', () => {
    buggedConfig = { botUserAgents: [123], databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'botUserAgents');
    }
  });

  it('should throw an error when timeout is not a number.', () => {
    buggedConfig = { timeout: 'abc', databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is equal to zero.', () => {
    buggedConfig = { timeout: 0, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when timeout is less than zero.', () => {
    buggedConfig = { timeout: -50, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'timeout');
    }
  });

  it('should throw an error when whitelistedRequestURLs is not an array.', () => {
    buggedConfig = { whitelistedRequestURLs: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'whitelistedRequestURLs');
    }
  });

  it('should throw an error when whitelistedRequestURLs is not string[].', () => {
    buggedConfig = { whitelistedRequestURLs: [123], databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'whitelistedRequestURLs');
    }
  });

  it('should throw an error when blacklistedRequestURLs is not an array.', () => {
    buggedConfig = { blacklistedRequestURLs: 123, databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'blacklistedRequestURLs');
    }
  });

  it('should throw an error when blacklistedRequestURLs is not string[].', () => {
    buggedConfig = { blacklistedRequestURLs: [123], databaseOptions };

    try {
      new PrerendererService(buggedConfig);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, InvalidConfigException);
      assert.include(e.message, 'blacklistedRequestURLs');
    }
  });
});
