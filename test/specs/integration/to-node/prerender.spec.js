const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const { createDirectHttpGetRequest, getResponseBody } = require('../../../client');

describe('prerender requests sent directly to NodeJS', () => {
  it('should receive prerendered index.html.', async () => {
    const { response } = await createDirectHttpGetRequest('index.html', {}, true);
    const body = await getResponseBody(response);
    const $ = cheerio.load(body);

    assert.equal($('#app').length, 1);
  });

  // TODO: test inners of prerenderer, such as request catcher.
});
