const mocha = require('mocha');
const fsExtra = require('fs-extra');
const { join } = require('path');

const server = require('../static-server');

mocha.before(async () => {
  await server.start();

  const tmpDir = join(process.cwd(), 'test', 'tmp');
  await fsExtra.mkdirp(tmpDir);
  await fsExtra.emptyDir(tmpDir);
});

mocha.after(async () => {
  await server.close();
});
