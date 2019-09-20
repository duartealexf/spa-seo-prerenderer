const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');

const {
  createDumbProxyHttpGetRequest,
  getResponseBody,
  requestSmartProxyDecidedToPrerender,
} = require('../../../client');
const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('prerender requests to NodeJS behind dumb Nginx proxy', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should receive prerendered index.html.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();
    await p.start();

    const { response } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    const body = await getResponseBody(response);
    const $ = cheerio.load(body);

    assert.equal($('#app').length, 1);
  });

  it('should pass through dumb proxy.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();
    await p.start();

    const { request } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    assert.isFalse(requestSmartProxyDecidedToPrerender(request));
  });
});
