const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const { createDirectHttpGetRequest } = require('../../../client');

describe('prerender requests sent directly to NodeJS', () => {
  // it('should receive prerendered index.html.', async () => {
  //   const { response } = await createDirectHttpGetRequest('index.html', {}, true);
  //   const $ = cheerio.load(response.body);
  //   assert.equal($('#app').length, 1);
  // });
  // TODO: test inners of prerenderer, such as request catcher.
  // TODO: add context test
});
