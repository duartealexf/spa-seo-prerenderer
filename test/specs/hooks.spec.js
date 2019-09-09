const mocha = require('mocha');
const fsExtra = require('fs-extra');
const { join } = require('path');

const testAppServer = require('../servers/test-app-server');
const prerendererServer = require('../servers/prerenderer-server');

mocha.before(async () => {
  /**
   * Start test app server.
   */
  await testAppServer.start();
  await testAppServer.attachMiddlewares({
    snapshotsDirectory: join(process.cwd(), 'test', 'tmp'),
    snapshotsDriver: 'fs',
    timeout: 8640000
  });

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
   * Empty tmp dir.
   */
  const tmpDir = join(process.cwd(), 'test', 'tmp');
  await fsExtra.mkdirp(tmpDir);
  await fsExtra.emptyDir(tmpDir);
});

mocha.after(async () => {
  await testAppServer.close();
  await prerendererServer.close();
});
