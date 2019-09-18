const mocha = require('mocha');
const fsExtra = require('fs-extra');
const { join } = require('path');

const prerendererServer = require('../servers/prerenderer-server');
const staticServer = require('../servers/static-server');
const appServer = require('../servers/app-server');

mocha.before(async () => {
  /**
   * Start prerenderer server.
   */
  await prerendererServer.start();
  await prerendererServer.attachPrerenderWithConfig({
    snapshotsDirectory: join(process.cwd(), 'test', 'tmp'),
    snapshotsDriver: 'fs',
    timeout: 8640000
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
    snapshotsDriver: 'fs',
    timeout: 8640000
  });

  /**
   * Empty tmp dir.
   */
  const tmpDir = join(process.cwd(), 'test', 'tmp');
  await fsExtra.mkdirp(tmpDir);
  await fsExtra.emptyDir(tmpDir);
});

mocha.after(async () => {
  await prerendererServer.close();
  await staticServer.close();
  await appServer.close();
});
