const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { createGetRequest, createPostRequest } = require('../../static-client');
const { Prerenderer } = require('../../../dist/lib/prerenderer');

describe('prerender results', () => {
  /**
   * @type {import('../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should prerender index.html.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();
    await p.start();

    const r = await createGetRequest('/index.html', {}, true);
    await p.prerender(r);

    assert.isNotEmpty(p.getLastResponse());
  });
});
