const { describe, it } = require('mocha');
const { assert } = require('chai');

const { createDirectHttpGetRequest } = require('../../../client');
const { DEFAULT_IGNORED_QUERY_PARAMETERS } = require('../../../../dist/lib/config/defaults');
const { Snapshot } = require('../../../../dist/lib/snapshot');
const { parseRequestURL } = require('../../../../dist/lib/request');
const {
  getService,
  ensureSnapshotFromRequestIsMaybeSaved,
} = require('../../../servers/app-server');

// require('../../hooks.spec');

describe('service request handling', () => {
  it('should use a cached snapshot from database.', async () => {
    getService().getConfig().cacheMaxAge = 7;

    const { request: request1 } = await createDirectHttpGetRequest('copies/1.html');
    const url = parseRequestURL(request1);
    await ensureSnapshotFromRequestIsMaybeSaved(request1);
    const snapshot1 = await Snapshot.findByUrl(url.toString());
    assert.ok(snapshot1);

    const { request: request2 } = await createDirectHttpGetRequest('copies/1.html');
    await ensureSnapshotFromRequestIsMaybeSaved(request2);
    const snapshot2 = await Snapshot.findByUrl(url.toString());

    assert.strictEqual(snapshot1.getUpdatedAt().valueOf(), snapshot2.getUpdatedAt().valueOf());
  });

  it('should have sorted query string parameters.', async () => {
    const { request } = await createDirectHttpGetRequest('copies/2.html?t3&t2=b&t1=a');
    const url = parseRequestURL(request);

    url.searchParams.sort();

    await ensureSnapshotFromRequestIsMaybeSaved(request);
    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.ok(snapshot);
  });

  it('should have removed ignored query string parameters.', async () => {
    const { request } = await createDirectHttpGetRequest(
      'copies/3.html?t1=a&utm_source=test1&utm_campaign=test2',
    );
    const url = parseRequestURL(request);

    url.searchParams.sort();
    DEFAULT_IGNORED_QUERY_PARAMETERS.forEach((p) => url.searchParams.delete(p));

    await ensureSnapshotFromRequestIsMaybeSaved(request);
    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.ok(snapshot);
  });

  it('should have ignored url fragment.', async () => {
    const { request } = await createDirectHttpGetRequest('copies/4.html#title');
    const url = parseRequestURL(request);

    url.hash = '';

    await ensureSnapshotFromRequestIsMaybeSaved(request);
    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.ok(snapshot);
  });

  it('should have done all of the above simultaneously.', async () => {
    const { request } = await createDirectHttpGetRequest(
      'copies/5.html?t1=a&utm_source=test1&utm_campaign=test2#title',
    );
    const url = parseRequestURL(request);

    url.searchParams.sort();
    DEFAULT_IGNORED_QUERY_PARAMETERS.forEach((p) => url.searchParams.delete(p));
    url.hash = '';

    await ensureSnapshotFromRequestIsMaybeSaved(request);
    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.ok(snapshot);
  });

  it('test middleware should have refreshed snapshot cache after having received response.', async () => {
    getService().getConfig().cacheMaxAge = 0;

    const { request: request1 } = await createDirectHttpGetRequest('copies/6.html');
    const url = parseRequestURL(request1);

    const snapshot1 = await Snapshot.findByUrl(url.toString());

    const { request: request2 } = await createDirectHttpGetRequest('copies/6.html');
    const snapshot2 = await Snapshot.findByUrl(url.toString());

    assert.instanceOf(snapshot1.getUpdatedAt(), Date);
    assert.instanceOf(snapshot2.getUpdatedAt(), Date);

    assert.strictEqual(snapshot1.getUpdatedAt().valueOf(), snapshot2.getUpdatedAt().valueOf());

    await ensureSnapshotFromRequestIsMaybeSaved(request2);

    const snapshot3 = await Snapshot.findByUrl(url.toString());
    assert.notEqual(snapshot2.getUpdatedAt().valueOf(), snapshot3.getUpdatedAt().valueOf());

    getService().getConfig().cacheMaxAge = 7;
  });

  it('should save response with status 400.', async () => {
    const { request } = await createDirectHttpGetRequest('status/400.html');
    const url = parseRequestURL(request);

    await ensureSnapshotFromRequestIsMaybeSaved(request);

    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.isOk(snapshot);
  });

  it('should not save response with status 500.', async () => {
    const { request, response } = await createDirectHttpGetRequest('status/500.html');
    assert.strictEqual(response.statusCode, 500);

    const url = parseRequestURL(request);

    await ensureSnapshotFromRequestIsMaybeSaved(request);

    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.isNotOk(snapshot);
  });

  it('should not save response with empty body.', async () => {
    const { request, response } = await createDirectHttpGetRequest('status/304.html');
    assert.strictEqual(response.statusCode, 500);
    assert.isEmpty(response.body);

    const url = parseRequestURL(request);

    await ensureSnapshotFromRequestIsMaybeSaved(request);

    const snapshot = await Snapshot.findByUrl(url.toString());
    assert.isNotOk(snapshot);
  });
});
