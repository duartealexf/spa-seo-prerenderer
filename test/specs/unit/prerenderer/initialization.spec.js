const { describe, it } = require('mocha');
const { assert } = require('chai');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const {
  PrerendererNotReadyException,
} = require('../../../../dist/lib/exceptions/prerenderer-not-ready-exception');

describe('non-initialization errors', () => {
  it('should throw an error if starting server without initialization.', async () => {
    const p = new Prerenderer();

    try {
      await p.start();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, PrerendererNotReadyException);
    }
    await p.stop();
  });

  it('should throw an error if logging something without initialization.', async () => {
    const p = new Prerenderer();

    try {
      await p.getLogger();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, PrerendererNotReadyException);
    }
    await p.stop();
  });

  it('should throw an error if trying to start without initialization.', async () => {
    const p = new Prerenderer();

    try {
      await p.start();
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, PrerendererNotReadyException);
    }
    await p.stop();
  });

  it('should throw an error if trying to prerender without start.', async () => {
    const p = new Prerenderer();

    try {
      await p.prerender(null);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, PrerendererNotReadyException);
    }
    await p.stop();
  });
});
