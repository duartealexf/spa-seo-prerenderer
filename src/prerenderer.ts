import puppeteer, { Browser, Response, LaunchOptions, Page } from 'puppeteer';
import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';
import { extname } from 'path';
import { URL } from 'url';

import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';
import { PuppeteerException } from './exceptions/puppeteer-exception';
import { Snapshot } from './snapshot';
import { Config } from './config';
import { Logger } from './logger';

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

    let userAgent = Prerenderer.getRequestHeader(request, 'user-agent');

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

    const parsedUrl = Prerenderer.parseUrl(request);

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
  public async prerenderAndGetSnapshot(request: IncomingMessage): Promise<Snapshot> {
    if (!this.browser) {
      throw new PrerendererNotReadyException(
        "Prerenderer service needs to be started before prerendering an url. Did you call prerenderer service's start()?",
      );
    }

    const page = await this.browser.newPage();

    const renderStart = Date.now();
    const url = Prerenderer.parseUrl(request);

    try {
      const response = await this.navigatePageAndGetSnapshot(page, url);
      return response;
    } catch (error) {
      let message: string;
      let status = 400;

      if (error instanceof PuppeteerException) {
        status = error.statusCode;
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object') {
        message = JSON.stringify(error);
      } else {
        message = error;
      }

      this.logger.error(message, 'puppeteer');

      await page.close();

      const snapshot = new Snapshot();
      snapshot.url = url.toString();
      snapshot.body = '';
      snapshot.status = status;
      snapshot.headers = {
        'X-Original-Location': url.toString(),
        'X-Prerendered-Ms': (Date.now() - renderStart).toString(),
      };

      return snapshot;
    }
  }

  /**
   * Navigate given Puppeteer page according to request.
   * @param page
   * @param request
   */
  private async navigatePageAndGetSnapshot(page: Page, url: URL): Promise<Snapshot> {
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
    page.evaluateOnNewDocument('if (window.customElements) customElements.forcePolyfill = true;');
    page.evaluateOnNewDocument('ShadyDOM = { force: true }');
    page.evaluateOnNewDocument('ShadyCSS = { shimcssproperties: true }');

    let puppeteerResponse: Response | null = null;

    /**
     * Navigate to page and wait for network to be idle.
     */
    puppeteerResponse = await page.goto(url.toString(), {
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

    const body = await page.content();
    await page.close();

    const snapshot = new Snapshot();
    snapshot.url = url.toString();
    snapshot.body = body;
    snapshot.status = status;
    snapshot.headers = {
      'X-Original-Location': url.toString(),
      'X-Prerendered-Ms': (Date.now() - renderStart).toString(),
    };

    return snapshot;
  }

  /**
   * Get header from request.
   * @param request
   * @param header
   */
  private static getRequestHeader(request: IncomingMessage, header: string): string {
    const headerEntry = Object.entries(request.headers).find(([k]) => k.toLowerCase() === header);

    if (!headerEntry) {
      return '';
    }

    let [, headerValue] = headerEntry;
    headerValue = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;

    return headerValue || '';
  }

  /**
   * Parse URL from given request.
   * @param request
   */
  public static parseUrl(request: IncomingMessage): URL {
    let protocol = Prerenderer.getRequestHeader(request, 'x-forwarded-proto');
    let host = Prerenderer.getRequestHeader(request, 'x-forwarded-host');
    let port = Prerenderer.getRequestHeader(request, 'x-forwarded-port');

    const path = request.url || '/';

    if (!protocol) {
      protocol =
        request.connection instanceof TLSSocket && request.connection.encrypted ? 'https' : 'http';
    }

    /**
     * Adapted from express hostname getter.
     */
    const hostAndMaybePort = Prerenderer.getRequestHeader(request, 'host');
    const offset = hostAndMaybePort[0] === '[' ? hostAndMaybePort.indexOf(']') + 1 : 0;
    const index = hostAndMaybePort.indexOf(':', offset);

    if (!host) {
      host = index !== -1 ? hostAndMaybePort.substring(0, index) : hostAndMaybePort;
    }

    if (!port) {
      port = index !== -1 ? hostAndMaybePort.substring(index + 1) : port;

      if (!port) {
        port = request.connection.localPort.toString();
      }
    }

    if (port === '80' || port === '433') {
      port = '';
    } else {
      port = `:${port}`;
    }

    return new URL(`${protocol}://${host}${port}${path}`);
  }
}
