import puppeteer, { Browser, Response } from 'puppeteer';
import { Request } from 'express';

import { extname } from 'path';
import { Config } from './config';
import { Logger } from './logger';
import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';
import { PrerendererConfigParams } from './config/defaults';

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
   * Get last prerender response object.
   */
  private lastResponse?: PrerendererResponse;

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
    this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
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
   * Get whether given request should be prerendered, considering request
   * method, blacklisted and whitelisted user agents, extensions and paths.
   * @param request NodeJS request.
   */
  public async shouldPrerender(request: Request): Promise<boolean> {
    /**
     * If it is not valid url, don't prerender.
     */
    if (!/^https?:\/\//.test(request.url)) {
      return false;
    }

    /**
     * Only prerender GET requests.
     */
    if (request.method !== 'GET') {
      return false;
    }

    const userAgent = request.headers['user-agent'];

    /**
     * No user agent, don't prerender.
     */
    if (!userAgent) {
      return false;
    }

    /**
     * If it is not a known bot user agent, don't prerender.
     */
    if (!this.config.getBotUserAgents().includes(userAgent.toLowerCase())) {
      return false;
    }

    // TODO: is this the actual path and extension?
    const path = request.originalUrl;
    const extension = extname(path);

    /**
     * If it is not an extension that can prerender, don't prerender.
     */
    if (!this.config.getPrerenderableExtensions().includes(extension.toLowerCase())) {
      return false;
    }

    /**
     * If it is not a prerenderable path, don't prerender.
     */
    if (!this.config.getPrerenderablePathRegExps().some((r) => r.test(path))) {
      return false;
    }

    return true;
  }

  public async prerender(request: Request): Promise<void> {
    if (!this.browser) {
      throw new PrerendererNotReadyException(
        'Prerenderer needs to be started before prerendering an url. Did you call prerenderer.start()?',
      );
    }

    const url = request.url;

    try {
      // https://github.com/brijeshpant83/bp-pre-puppeteer-node/blob/master/index.js#L200
      // might need to change the url to x-forwarded-host

      const renderStart = Date.now();
      const page = await this.browser.newPage();

      page.setUserAgent(Prerenderer.USER_AGENT);

      // TODO: handle certificate error and continue
      // TODO: follow redirects

      // TODO: create list of url patterns to block request to (i.e. analytics)
      page.on('request', (req) => {
        // Don't load Google Analytics lib requests so pageviews aren't 2x.
        const blacklist = ['www.google-analytics.com', '/gtag/js', 'ga.js', 'analytics.js'];

        /* This is from https://github.com/prerender/prerender/blob/master/lib/server.js
         * Do we need it?
        //if the original server had a chunked encoding, we should
        //remove it since we aren't sending a chunked response
        res.removeHeader('Transfer-Encoding');
        //if the original server wanted to keep the connection alive, let's close it
        res.removeHeader('Connection');
        //getting 502s for sites that return these headers
        res.removeHeader('X-Content-Security-Policy');
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('Content-Encoding');

        res.status(req.prerender.statusCode);
         */

        if (blacklist.find((pattern: string) => req.url().match(pattern))) {
          req.abort();
          return;
        }
        req.continue();
      });

      // Page.addScriptToEvaluateOnNewDocument({source: 'if (window.customElements) {
      // customElements.forcePolyfill = true'}); }
      // Page.addScriptToEvaluateOnNewDocument({source: 'ShadyDOM = {force: true}'})
      // Page.addScriptToEvaluateOnNewDocument({source: 'ShadyCSS = {shimcssproperties: true}'})

      let response: Response | null = null;

      // Capture main frame response. This is used in the case that rendering
      // times out, which results in puppeteer throwing an error. This allows us
      // to return a partial response for what was able to be rendered in that
      // time frame.
      page.addListener('response', (r: Response) => {
        if (!response) {
          response = r;
        }
      });

      try {
        // Navigate to page. Wait until there are no oustanding network requests.
        response = await page.goto(url, {
          timeout: this.config.getTimeout(),
          waitUntil: 'networkidle0',
        });
      } catch (e) {
        // TODO: do something other than console error.
        // console.error(e);
      }

      if (!response) {
        // console.error('response does not exist');
        // This should only occur when the page is about:blank. See
        // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
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
      if (response.headers()['metadata-flavor'] === 'Google') {
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
      let status = response.status();

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
          'X-Original-Location': url,
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
