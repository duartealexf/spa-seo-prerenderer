import puppeteer, { Browser, Response, LaunchOptions, Page } from 'puppeteer';
import { IncomingMessage } from 'http';
import { extname } from 'path';

import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';
import { PuppeteerException } from './exceptions/puppeteer-exception';
import { Snapshot } from './snapshot';
import { Config } from './config';
import { Logger } from './logger';
import { getRequestHeader, parseRequestURL } from './request';

/**
 * Reasons why the Prerender rejects prerendering a request, on shouldPrerender() method.
 */
export type ReasonsToRejectPrerender =
  /**
   * Initial value.
   */
  | undefined

  /**
   * Request is falsy.
   */
  | 'no-request'

  /**
   * Received request is not an instance of http.IncomingMessage
   */
  | 'rejected-request'

  /**
   * Request method is not GET.
   */
  | 'rejected-method'

  /**
   * No user agent in request.
   */
  | 'no-user-agent'

  /**
   * User agent was not a known bot.
   */
  | 'rejected-user-agent'

  /**
   * Request file extension was not meant to be prerendered, as per config.
   */
  | 'rejected-extension'

  /**
   * Request path extension was not meant to be prerendered, as per config.
   */
  | 'rejected-path';

/**
 * Based on https://github.com/GoogleChrome/rendertron
 */
export class Prerenderer {
  /**
   * Puppeteer browser.
   */
  private browser?: Browser;

  /**
   * Prerenderer service configuration singleton.
   */
  private config: Config;

  /**
   * Prerenderer service logger singleton.
   */
  private logger: Logger;

  /**
   * Reason why it has decided to not prerender last time.
   */
  private lastRejectedPrerenderReason?: ReasonsToRejectPrerender;

  /**
   * Prerenderer user agent including version.
   */
  public static readonly USER_AGENT = 'Mozilla/5.0 (compatible; prerenderer/{{version}})';

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Start prerenderer headless browser.
   */
  public async start(): Promise<void> {
    this.logger.info('Launching Puppeteer...', 'prerenderer');
    const options: LaunchOptions = {
      args: ['--no-sandbox'],
      ignoreHTTPSErrors: true,
    };

    if (this.config.getChromiumExecutable()) {
      options.executablePath = this.config.getChromiumExecutable();
    }

    this.browser = await puppeteer.launch(options);
    this.logger.info('Launched Puppeteer!', 'prerenderer');
  }

  /**
   * Stop prerenderer headless browser.
   */
  public async stop(): Promise<void> {
    if (this.browser) {
      this.logger.info('Stopping Puppeteer...', 'prerenderer');
      await this.browser.close();
      this.logger.info('Stopped Puppeteer!', 'prerenderer');
    }
  }

  /**
   * Get the reason why it has decided to not prerender last time.
   */
  public getLastRejectedPrerenderReason(): ReasonsToRejectPrerender {
    return this.lastRejectedPrerenderReason;
  }

  /**
   * Get whether given request should be prerendered, considering request
   * method, blacklisted and whitelisted user agents, extensions and paths.
   * @param request NodeJS request.
   */
  public shouldPrerender(request: IncomingMessage): boolean {
    if (!request) {
      this.lastRejectedPrerenderReason = 'no-request';
      return false;
    }

    if (!(request instanceof IncomingMessage)) {
      this.lastRejectedPrerenderReason = 'rejected-request';
      return false;
    }

    /**
     * Only prerender GET requests.
     */
    if (request.method !== 'GET') {
      this.lastRejectedPrerenderReason = 'rejected-method';
      return false;
    }

    let userAgent = getRequestHeader(request, 'user-agent');

    /**
     * No user agent, don't prerender.
     */
    if (!userAgent) {
      this.lastRejectedPrerenderReason = 'no-user-agent';
      return false;
    }

    userAgent = userAgent.toLowerCase();

    /**
     * If it is not a known bot user agent, don't prerender.
     */
    if (!this.config.getBotUserAgents().includes(userAgent)) {
      this.lastRejectedPrerenderReason = 'rejected-user-agent';
      return false;
    }

    const parsedUrl = parseRequestURL(request);

    const path = parsedUrl.pathname || '';
    const extension = extname(path)
      .substr(1)
      .toLowerCase();

    /**
     * If it is not an extension that can prerender, don't prerender.
     */
    if (!this.config.getPrerenderableExtensions().includes(extension)) {
      this.lastRejectedPrerenderReason = 'rejected-extension';
      return false;
    }

    /**
     * If it is not a prerenderable path, don't prerender.
     */
    if (!this.config.getPrerenderablePathRegExps().some((r) => r.test(path))) {
      this.lastRejectedPrerenderReason = 'rejected-path';
      return false;
    }

    this.lastRejectedPrerenderReason = undefined;
    return true;
  }

  /**
   * Prerender given request and return a snapshot, that can be stored later.
   * @param request Original incoming request.
   */
  public async prerenderAndGetSnapshot(url: string): Promise<Snapshot> {
    if (!this.browser) {
      throw new PrerendererNotReadyException(
        "Prerenderer service needs to be started before prerendering an url. Did you call prerenderer service's start()?",
      );
    }

    const page = await this.browser.newPage();

    const renderStart = Date.now();

    try {
      this.logger.info(`Prerendering ${url}`, 'prerenderer');
      const snapshot = await this.navigatePageAndGetSnapshot(page, url);
      this.logger.info(`Prerendered ${url}`, 'prerenderer');
      return snapshot;
    } catch (error) {
      let message: string;
      let status = 400;

      if (error instanceof PuppeteerException) {
        status = error.statusCode;
        message = error.message;
      } else {
        message = Logger.stringify(error);
      }

      this.logger.error(message, 'puppeteer');

      await page.close();

      return new Snapshot(url, '', status, Date.now() - renderStart);
    }
  }

  /**
   * Navigate given Puppeteer page according to request.
   * @param page
   * @param request
   */
  private async navigatePageAndGetSnapshot(page: Page, url: string): Promise<Snapshot> {
    const renderStart = Date.now();

    page.setUserAgent(Prerenderer.USER_AGENT);
    page.setRequestInterception(true);

    const blacklist = this.config.getBlacklistedRequestURLs();
    const whitelist = this.config.getWhitelistedRequestURLs();

    const requestFilter = (req: puppeteer.Request): void => {
      if (whitelist.some((p) => req.url().includes(p))) {
        req.continue();
        return;
      }
      if (blacklist.some((p) => req.url().includes(p))) {
        req.abort();
        return;
      }
      req.continue();
    };

    page.on('request', requestFilter);

    /**
     * Add shadow dom shim.
     */
    try {
      await page.evaluateOnNewDocument(
        'if (window.customElements) customElements.forcePolyfill = true;',
      );
      await page.evaluateOnNewDocument('ShadyDOM = { force: true }');
      await page.evaluateOnNewDocument('ShadyCSS = { shimcssproperties: true }');
    } catch (e) {
      const message = Logger.stringify(e);
      this.logger.warning(`Could not inject needed page scripts: ${message}`, 'puppeteer');
    }

    let puppeteerResponse: Response | null = null;

    /**
     * Navigate to page and wait for network to be idle.
     */
    puppeteerResponse = await page.goto(url, {
      timeout: this.config.getTimeout(),
      waitUntil: 'networkidle0',
    });

    if (!puppeteerResponse) {
      throw new PuppeteerException(400, 'Puppeteer received no response.');
    }

    let status = puppeteerResponse.status();

    /**
     * If browser uses cache and sees 304, consider 200.
     */
    if (status === 304) {
      status = 200;
    }

    /**
     * If there's a meta-tag with a custom status, deliver that status instead of 200.
     */
    const customStatus = await Prerenderer.getCustomStatus(page);

    if (status === 200 && customStatus) {
      status = customStatus;
    }

    Prerenderer.stripTags(page);

    const body = await page.content();
    await page.close();

    return new Snapshot(url, body, status, Date.now() - renderStart);
  }

  /**
   * Get custom status do be delivered, if any.
   * Based on Google's Rendertron.
   * @param page
   */
  public static async getCustomStatus(page: puppeteer.Page): Promise<number | undefined> {
    return page
      .$eval('meta[name="prerenderer:status"]', (element) =>
        parseInt(element.getAttribute('content') || '', 10),
      )
      .catch(() => undefined);
  }

  /**
   * Strip unecessary tags after prerender.
   * Based on Google's Rendertron.
   * @param page
   */
  public static stripTags(page: puppeteer.Page): Promise<void> {
    return page.evaluate(() => {
      // eslint-disable-next-line no-undef
      Array.from(
        document.querySelectorAll(
          'script:not([type]), script[type*="javascript"], link[rel=import]',
        ),
      ).forEach((e) => e.remove());
    });
  }
}
