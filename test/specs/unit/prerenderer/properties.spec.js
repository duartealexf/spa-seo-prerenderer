const { describe, it } = require('mocha');
const { assert } = require('chai');

const { PrerendererService } = require('../../../../dist/lib/service');
const { Prerenderer } = require('../../../../dist/lib/prerenderer');
const { Database } = require('../../../../dist/lib/database');
const { Logger } = require('../../../../dist/lib/logger');
const { Config } = require('../../../../dist/lib/config');

describe('prerenderer property checks after start up', async () => {
  const prerenderer = new PrerendererService({
    databaseOptions: {
      host: process.env.TEST_DB_HOST,
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
    },
  });

  it('prerenderer should be a Prerenderer instance.', async () => {
    assert.instanceOf(prerenderer.getPrerenderer(), Prerenderer);
  });

  it('database should be a Database instance.', async () => {
    assert.instanceOf(prerenderer.getDatabase(), Database);
  });

  it('config should be a Config instance.', async () => {
    assert.instanceOf(prerenderer.getConfig(), Config);
  });

  it('logger should be a Logger instance.', async () => {
    assert.instanceOf(prerenderer.getLogger(), Logger);
  });
});
