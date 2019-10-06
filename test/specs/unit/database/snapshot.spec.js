const { describe, it } = require('mocha');
const { assert } = require('chai');
const { v4: uuidv4 } = require('uuid');

const { PrerendererService } = require('../../../../dist/lib/service');
const { Snapshot } = require('../../../../dist/lib/snapshot');

describe('database unit tests', () => {
  const makeUrl = () => `http://${uuidv4()}.com`;

  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
   */
  const initialConfig = {
    databaseOptions: {
      authSource: 'admin',
      host: process.env.TEST_DB_HOST,
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
    },
    nodeEnv: 'development',
  };

  const p = new PrerendererService(initialConfig);

  /**
   * @type {import('../../../../dist/types/snapshot').PrerendererHeaders}
   */
  const headers = {
    'X-Prerendered-Ms': '5376',
    'X-Original-Location': 'http://example.com',
  };

  /**
   * @type {import('../../../../dist/lib/snapshot').Snapshot}
   */
  let snapshot;

  before(async () => {
    snapshot = new Snapshot();
    snapshot.url = makeUrl();
    snapshot.body = uuidv4();
    snapshot.status = 200;
    snapshot.headers = headers;

    await p.start();
    await snapshot.save();
  });

  after(() => p.stop());

  it('should have saved a snapshot to database.', async () => {
    assert.isTrue(snapshot.hasId());
  });

  it('should retrieve a saved snapshot to database by URL.', async () => {
    const retrievedSnapshot = await Snapshot.findByUrl(snapshot.url);
    assert.ok(retrievedSnapshot);
    assert.equal(retrievedSnapshot.url, snapshot.url);
    assert.equal(retrievedSnapshot.body, snapshot.body);
    assert.equal(retrievedSnapshot.status, snapshot.status);
    assert.equal(retrievedSnapshot.headers, snapshot.headers);
  });

  it('saved snapshot should have an updatedAt date.', async () => {
    const retrievedSnapshot = await Snapshot.findByUrl(snapshot.url);
    assert.instanceOf(retrievedSnapshot.updatedAt, Date);
  });
});
