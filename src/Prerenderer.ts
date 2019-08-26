import puppeteer, { Browser } from 'puppeteer';
import './Config';

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

  public async loadPage() {
    const page = await this.browser.newPage();
    return page;
  }
}

const singleton = new Prerenderer();
export { singleton as Prerenderer };
