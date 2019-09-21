const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const {
  createDumbProxyHttpGetRequest,
  requestSmartProxyDecidedToPrerender,
} = require('../../../client');

describe('prerender requests to NodeJS behind dumb Nginx proxy', () => {
  it('should receive prerendered index.html.', async () => {
    const { response } = await createDumbProxyHttpGetRequest('index.html', {}, true);
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });
});
