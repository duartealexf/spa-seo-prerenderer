const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const { createDirectHttpGetRequest, createDirectHttpsGetRequest } = require('../../../client');

describe("features that are in Prerenderer's Puppeteer", () => {
  it('should have test requests flowing to the expected context.', async () => {
    const { context } = await createDirectHttpGetRequest('index.html');
    assert.equal(context, 'app');
  });

  it('should ignore https errors.', async () => {
    const { response } = await createDirectHttpsGetRequest('index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should follow page redirects.', async () => {
    const { response } = await createDirectHttpGetRequest('redirect-index/from.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should follow resource redirects.', async () => {
    const { response } = await createDirectHttpGetRequest('redirect-resource/index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should use resources whitelist.', async () => {
    const { response } = await createDirectHttpGetRequest('whitelist/index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 1);
  });

  it('should use resources blacklist.', async () => {
    const { response } = await createDirectHttpGetRequest('blacklist/index.html');
    const $ = cheerio.load(response.body);
    assert.equal($('#app').length, 0);
    assert.equal($('body').length, 1);
  });

  it('should see response with status 500 for aborted request, empty response.', async () => {
    const { response } = await createDirectHttpGetRequest('status/304.html');
    assert.isEmpty(response.body);
    assert.equal(response.statusCode, 500);
  });

  it('should see response with status 400.', async () => {
    const { response } = await createDirectHttpGetRequest('status/400.html');
    const $ = cheerio.load(response.body);
    assert.equal(response.statusCode, 400);
    assert.equal($('body').length, 1);
    assert.equal($('#app').length, 0);
  });

  it('should see response with status 404 from meta-tag.', async () => {
    const { response } = await createDirectHttpGetRequest('status/404.html');
    const $ = cheerio.load(response.body);
    assert.equal(response.statusCode, 404);
  });

  it('should have stripped link and script tags.', async () => {
    const { response } = await createDirectHttpGetRequest('strip-tags/index.html');
    const $ = cheerio.load(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal($('script:not([type]), script[type*="javascript"], link[rel=import]').length, 0);
  });
});
