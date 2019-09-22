const { describe, it } = require('mocha');
const { assert } = require('chai');
const cheerio = require('cheerio');

const { createDirectHttpGetRequest } = require('../../../client');

describe("features that are in Prerenderer's Puppeteer", () => {
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

  it('should see response with status 400 for aborted request, empty response.', async () => {
    const { response } = await createDirectHttpGetRequest('status/304.html');
    assert.isEmpty(response.body);
    assert.equal(response.statusCode, 400);
  });

  it('should see response with status 400.', async () => {
    const { response } = await createDirectHttpGetRequest('status/400.html');
    const $ = cheerio.load(response.body);
    assert.equal(response.statusCode, 400);
    assert.equal($('body').length, 1);
    assert.equal($('#app').length, 0);
  });

  it('should see response with status 400.', async () => {
    const { response } = await createDirectHttpGetRequest('status/400.html');
    const $ = cheerio.load(response.body);
    assert.equal(response.statusCode, 400);
    assert.equal($('body').length, 1);
    assert.equal($('#app').length, 0);
  });
});
