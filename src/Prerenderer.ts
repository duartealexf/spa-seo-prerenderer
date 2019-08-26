import puppeteer, { Browser } from 'puppeteer';
import './Config';

interface PrerenderedResponse {
  /**
   * Rendered HTML.
   */
  body: string;

  /**
   * Headers from Prerenderer.
   */
  headers: {
    'X-Original-Location': string;
    'X-Prerendered-Ms': number;
    [header: string]: string | number;
  };
}

/**
 * Based on https://developers.google.com/web/tools/puppeteer/articles/ssr
 */
class Prerenderer {
  /**
   * Puppeteer browser.
   */
  private browser: Browser;

  constructor() {}

  public async startServer() {
    this.browser = await puppeteer.launch();
  }

  public async stopServer() {
    await this.browser.close();
  }

  public async prerender(url: string): Promise<PrerenderedResponse> {
    try {
      const start = Date.now();
      const page = await this.browser.newPage();

      /**
       * networkidle0 waits for the network to be idle (no requests for 500ms).
       */
      await page.goto(url, { waitUntil: 'networkidle0' });

      const body = await page.content();
      const duration = Date.now() - start;

      return {
        body,
        headers: {
          'X-Original-Location': url,
          'X-Prerendered-Ms': duration,
        },
      };
    } catch (err) {
      console.error(err);
      throw new Error('page.goto/waitForSelector timed out.');
    }
  }

  public async createSnapshot(responseData: PrerenderedResponse) {}
}

const singleton = new Prerenderer();
export { singleton as Prerenderer };
