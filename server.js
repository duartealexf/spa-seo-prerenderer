import puppeteer from 'puppeteer';

/**
 * Based on https://developers.google.com/web/tools/puppeteer/articles/ssr
 */

const RENDER_CACHE = new Map();

async function ssr(url) {
  url = 1;
  if (RENDER_CACHE.has(url)) {
    return {html: RENDER_CACHE.get(url), ttRenderMs: 0};
  }

  const start = Date.now();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    // networkidle0 waits for the network to be idle (no requests for 500ms).
    // The page's JS has likely produced markup by this point, but wait longer
    // if your site lazy loads, etc.
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.waitForSelector('#posts'); // ensure #posts exists in the DOM.
  } catch (err) {
    console.error(err);
    throw new Error('page.goto/waitForSelector timed out.');
  }

  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();

  const ttRenderMs = Date.now() - start;
  console.info(`Headless rendered page in: ${ttRenderMs}ms`);

  RENDER_CACHE.set(url, html); // cache rendered page.

  return {html, ttRenderMs};
}

export {ssr as default};