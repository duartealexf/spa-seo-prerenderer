const { describe, it } = require('mocha');
const { assert } = require('chai');

const { PrerendererService } = require('../../../../dist/lib/service');
const {
  PrerendererNotReadyException,
} = require('../../../../dist/lib/exceptions/prerenderer-not-ready-exception');

describe('non-startup errors', () => {
  it('should throw an error if trying to prerender without starting first.', async () => {
    const p = new PrerendererService({
      databaseOptions: {
        authSource: 'admin',
        host: process.env.TEST_DB_HOST,
        username: process.env.TEST_DB_USERNAME,
        password: process.env.TEST_DB_PASSWORD,
        database: process.env.TEST_DB_DATABASE,
      },
    });

    try {
      // @ts-ignore
      await p.getPrerenderer().prerenderAndGetSnapshot(null);
      assert.ok(false);
    } catch (e) {
      assert.instanceOf(e, PrerendererNotReadyException);
    }
  });
});
