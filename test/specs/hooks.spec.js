const mocha = require('mocha');
const fsExtra = require('fs-extra');
const { join } = require('path');

const prerendererServer = require('../servers/prerenderer-server');
const staticServer = require('../servers/static-server');
const appServer = require('../servers/app-server');

/**
 * @type {number}
 */
let startTime;

mocha.before(async () => {
  startTime = Date.now();

  console.log('Starting test servers...');

  /**
   * Start prerenderer server.
   */
  await prerendererServer.start();
  await prerendererServer.attachPrerenderWithConfig({
    snapshotsDirectory: join(process.cwd(), 'test', 'tmp'),
    filesystemDriver: 'fs',
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
    snapshotsDirectory: join(process.cwd(), 'test', 'tmp'),
    filesystemDriver: 'fs',
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
