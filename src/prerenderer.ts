import puppeteer, { Browser, Response as PuppeteerResponse, LaunchOptions } from 'puppeteer';
import { extname } from 'path';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IncomingMessage } from 'http';

import { Config } from './config';
import { Logger } from './logger';
import { PrerendererConfigParams } from './config/defaults';
import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';

interface PrerendererResponse {
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
  public static readonly USER_AGENT = 'prerenderer/{{version}}';

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
    const options: LaunchOptions = { args: ['--no-sandbox'] };

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
   * Get user agent header string from request.
   * @param request NodeJS request.
   */
  private static getRequestUserAgent(request: ExpressRequest): string {
    const keys = Object.getOwnPropertyNames(request.headers);
    const length = keys.length;

    for (let i = 0; i < length; i += 1) {
      const key = keys[i];
      const header = request.headers[key] as string;

      if (key.toLowerCase() === 'user-agent') {
        return header;
      }
    }

    return '';
  }

  /**
   * Get whether given request should be prerendered, considering request
   * method, blacklisted and whitelisted user agents, extensions and paths.
   * @param request NodeJS request.
   */
  public shouldPrerender(request: ExpressRequest): boolean {
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

    let userAgent = Prerenderer.getRequestUserAgent(request);

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

    const path = request.url.substr(1);
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

  public async prerender(request: ExpressRequest, response: ExpressResponse): Promise<void> {
    if (!this.browser) {
      throw new PrerendererNotReadyException(
        'Prerenderer needs to be started before prerendering an url. Did you call prerenderer.start()?',
      );
    }

    try {
      const protocol = request.protocol;
      const host = request.hostname;
      const port = request.connection.localPort === 80 ? '' : `:${request.connection.localPort}`;
      const path = request.originalUrl;

      // TODO: keep query paramss.
      const requestedUrl = `${protocol}://${host}${port}${path}`;

      const renderStart = Date.now();
      const page = await this.browser.newPage();

      page.setUserAgent(Prerenderer.USER_AGENT);
      page.setRequestInterception(true);

      // TODO: handle certificate error and continue
      // TODO: follow redirects
      const blacklist = this.config.getBlacklistedRequestURLs();
      const whitelist = this.config.getWhitelistedRequestURLs();

      let requestFilter: (req: puppeteer.Request) => void;

      if (whitelist.length) {
        requestFilter = (req: puppeteer.Request) => {
          if (whitelist.some((p) => req.url().includes(p))) {
            req.continue();
          } else {
            req.abort();
          }
        };
      } else {
        requestFilter = (req: puppeteer.Request) => {
          if (blacklist.some((p) => req.url().includes(p))) {
            req.abort();
          } else {
            req.continue();
          }
        };
      }

      page.on('request', requestFilter);

      /**
       * Add shadow dom shim.
       */
      page.evaluateOnNewDocument('if (window.customElements) customElements.forcePolyfill = true;');
      page.evaluateOnNewDocument('ShadyDOM = { force: true }');
      page.evaluateOnNewDocument('ShadyCSS = { shimcssproperties: true }');

      let puppeteerResponse: PuppeteerResponse | null = null;

      try {
        /**
         * Navigate to page and wait for network to be idle.
         */
        puppeteerResponse = await page.goto(requestedUrl, {
          timeout: this.config.getTimeout(),
          waitUntil: 'networkidle0',
        });
      } catch (e) {
        // TODO: do something other than console error.
        // console.error(e);
      }

      if (!puppeteerResponse) {
        /**
         * This should only occur when page is about:blank.
         * @see https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
         */
        await page.close();

        this.lastResponse = {
          headers: {
            status: 400,
            'X-Prerendered-Ms': Date.now() - renderStart,
          },
          body: '',
        };

        return;
      }

      // Disable access to compute metadata. See
      // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
      if (puppeteerResponse.headers()['metadata-flavor'] === 'Google') {
        await page.close();

        this.lastResponse = {
          headers: {
            status: 403,
            'X-Prerendered-Ms': Date.now() - renderStart,
          },
          body: '',
        };

        return;
      }

      // Set status to the initial server's response code. Check for a <meta
      // name="render:status_code" content="4xx" /> tag which overrides the status
      // code.
      let status = puppeteerResponse.status();

      const newStatusCode = await page
        .$eval('meta[name="render:status_code"]', (element) =>
          parseInt(element.getAttribute('content') || '', 10),
        )
        .catch(() => undefined);

      // On a repeat visit to the same origin, browser cache is enabled, so we may
      // encounter a 304 Not Modified. Instead we'll treat this as a 200 OK.
      if (status === 304) {
        status = 200;
      }

      // Original status codes which aren't 200 always return with that status
      // code, regardless of meta tags.
      if (status === 200 && newStatusCode) {
        status = newStatusCode;
      }

      // Inject <base> tag with the origin of the request (ie. no path).

      // Serialize page.
      const body = await page.content();

      await page.close();

      this.lastResponse = {
        body,
        headers: {
          status,
          'X-Original-Location': path,
          'X-Prerendered-Ms': Date.now() - renderStart,
        },
      };

      return;
    } catch (err) {
      // console.error(err);
      throw new Error('page.goto/waitForSelector timed out.');
    }
  }
}
