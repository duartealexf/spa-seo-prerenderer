const mocha = require('mocha');
const server = require('../static-server');
const { Prerenderer } = require('../../dist/lib/Prerenderer');

let prerenderer;

mocha.before(async () => {
  server.start();

  prerenderer = new Prerenderer();
  await prerenderer.initialize();
  await prerenderer.start();
});

mocha.after(async () => {
  server.close();
  await prerenderer.stop();
});
