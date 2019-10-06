const mocha = require('mocha');
const fsExtra = require('fs-extra');
const { join } = require('path');
const { createConnection } = require('typeorm');

const prerendererServer = require('../servers/prerenderer-server');
const staticServer = require('../servers/static-server');
const appServer = require('../servers/app-server');

const waitForDatabaseAvailability = (databaseOptions) =>
  new Promise((resolve) => {
    createConnection({ type: 'mongodb', ...databaseOptions })
      .then((connection) => {
        return connection.close();
      })
      .then(resolve)
      .catch(() => {
        setTimeout(() => waitForDatabaseAvailability(databaseOptions).then(resolve), 2000);
      });
  });

/**
 * @type {number}
 */
let startTime;

mocha.before(async () => {
  startTime = Date.now();

  /**
   * @type {import('../../dist/types/config/defaults').DatabaseOptions}
   */
  const databaseOptions = {
    authSource: 'admin',
    host: process.env.TEST_DB_HOST,
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_DATABASE,
  };

  console.log('Waiting for database availability...');

  await waitForDatabaseAvailability(databaseOptions);

  console.log('Starting test servers...');

  /**
   * Start prerenderer server.
   */
  await prerendererServer.start();
  await prerendererServer.attachPrerenderWithConfig({
    databaseOptions,
    timeout: 8640000,
  });

  /**
   * Start test app server.
   */
  await staticServer.start();
  staticServer.attachMiddlewares();

  /**
   * Start test app server.
   */
  await appServer.start();
  await appServer.attachMiddlewares({
    databaseOptions,
    timeout: 8640000,
    whitelistedRequestURLs: ['ga.js'],
  });

  /**
   * Empty tmp dir.
   */
  const tmpDir = join(process.cwd(), 'test', 'tmp');
  await fsExtra.mkdirp(tmpDir);
  await fsExtra.emptyDir(tmpDir);

  console.log('Starting tests...');
});

mocha.after(async () => {
  console.log('Closing test servers...');

  await prerendererServer.close();
  await staticServer.close();
  await appServer.close();

  console.log(`Finished tests in ${Date.now() - startTime}ms`);
});
