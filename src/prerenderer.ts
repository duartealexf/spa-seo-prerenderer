import puppeteer, { Browser, Response as PuppeteerResponse, LaunchOptions, Page } from 'puppeteer';
import { extname } from 'path';
import { IncomingMessage } from 'http';
import { URL } from 'url';

import { TLSSocket } from 'tls';
import { Config } from './config';
import { Logger } from './logger';
import { PrerendererConfigParams } from './config/defaults';
import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';
import { PrerendererResponseError } from './error';

export interface PrerendererResponse {
  /**
   * Rendered HTML.
   */
  body: string;

  /**
   * Headers from Prerenderer.
   */
  headers: {
    status: number;
    'X-Prerendered-Ms': number;
    [header: string]: string | number;
  };
}

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
   * Prerenderer configuration singleton.
   */
  private config: Config;

  /**
   * Prerenderer logger singleton.
   */
  private logger?: Logger;

  /**
   * Whether prerenderer has been initialized.
   */
  private initialized = false;

  /**
   * Last prerender response object.
   */
  private lastResponse?: PrerendererResponse;

  /**
   * Reason why it has decided to not prerender last time.
   */
  private lastRejectedPrerenderReason?: ReasonsToRejectPrerender;

  /**
   * Prerenderer user agent including version.
   */
  public static readonly USER_AGENT = 'Mozilla/5.0 (compatible; prerenderer/{{version}})';

  constructor(config: PrerendererConfigParams) {
    this.config = new Config(config);
  }

  /**
   * Initialize prerenderer setup, which is required before starting it.
   */
  public async initialize(): Promise<void> {
    await this.config.initialize();
    this.logger = new Logger(this.config);
    this.initialized = true;
  }

  /**
   * Getter for prerenderer configuration singleton.
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Getter for prerenderer logger singleton.
   */
  public getLogger(): Logger {
    if (!this.logger) {
      this.logger = new Logger(this.config);
    }

    return this.logger;
  }

  /**
   * Start prerenderer headless browser.
   */
  public async start(): Promise<void> {
    if (!this.initialized) {
      throw new PrerendererNotReadyException(
        'Prerenderer needs to be initialized before starting. Did you call prerenderer.initialize()?',
      );
    }

    this.getLogger().info('Launching Puppeteer...', 'prerenderer');
    const options: LaunchOptions = {
      args: ['--no-sandbox'],
      ignoreHTTPSErrors: true,
    };

    if (this.config.getChromiumExecutable()) {
      options.executablePath = this.config.getChromiumExecutable();
    }

    this.browser = await puppeteer.launch(options);
    this.getLogger().info('Launched Puppeteer!', 'prerenderer');
  }

  /**
   * Stop prerenderer headless browser.
   */
  public async stop(): Promise<void> {
    if (this.browser) {
      this.getLogger().info('Stopping Puppeteer...', 'prerenderer');
      await this.browser.close();
      this.getLogger().info('Stopped Puppeteer!', 'prerenderer');
    }
  }

  /**
   * Get response from last call to prerender().
   */
  public getLastResponse(): PrerendererResponse | undefined {
    return this.lastResponse;
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

  public async handleRequest(request: IncomingMessage): Promise<void> {
    if (!this.browser) {
      throw new PrerendererNotReadyException(
        'Prerenderer needs to be started before prerendering an url. Did you call prerenderer.start()?',
      );
    }

    const page = await this.browser.newPage();

    const renderStart = Date.now();

    await this.navigatePageWithRequest(page, request)
      .then((puppeteerResponse) => {
        this.lastResponse = puppeteerResponse;
      })
      .catch(async (error) => {
        let message: string;
        let status = 400;

        if (error instanceof PrerendererResponseError) {
          status = error.statusCode;
          message = error.message;
        } else if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'object') {
          message = JSON.stringify(error);
        } else {
          message = error;
        }

        this.getLogger().error(message, 'puppeteer');

        await page.close();
        const url = Prerenderer.parseUrl(request);

        this.lastResponse = {
          headers: {
            status,
            'X-Original-Location': url.toString(),
            'X-Prerendered-Ms': Date.now() - renderStart,
          },
          body: '',
        };
      });
  }

  /**
   * Navigate given Puppeteer page according to request.
   * @param page
   * @param request
   */
  private async navigatePageWithRequest(
    page: Page,
    request: IncomingMessage,
  ): Promise<PrerendererResponse> {
    const url = Prerenderer.parseUrl(request);
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

    let puppeteerResponse: PuppeteerResponse | null = null;

    /**
     * Navigate to page and wait for network to be idle.
     */
    puppeteerResponse = await page.goto(url.toString(), {
      timeout: this.config.getTimeout(),
      waitUntil: 'networkidle0',
    });

    if (!puppeteerResponse) {
      throw new PrerendererResponseError(400, 'Puppeteer received no response.');
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

    return {
      body,
      headers: {
        status,
        'X-Original-Location': url.toString(),
        'X-Prerendered-Ms': Date.now() - renderStart,
      },
    };
  }

  /**
   * Get given header from given request.
   * @param request
   * @param header
   */
  private static getRequestHeader(request: IncomingMessage, header: string): string {
    const headerEntry = Object.entries(request.headers).find(([k]) => k.toLowerCase() === header);

    if (!headerEntry) {
      return '';
    }

    return headerEntry[1] as string;
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
