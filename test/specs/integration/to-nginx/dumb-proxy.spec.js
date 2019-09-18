const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { createDumbProxyHttpGetRequest } = require('../../../client');
const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('should prerender requests to NodeJS behind Nginx proxy', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  // it('should prerender index.html.', async () => {
  //   const p = new Prerenderer(initialConfig);
  //   await p.initialize();
  //   await p.start();

  //   const { request, response } = await createDumbProxyHttpGetRequest('/index.html', {}, true);
  //   await p.prerender(request, response);
  //   await p.stop();

  //   assert.isNotEmpty(p.getLastResponse());
  // });
});
