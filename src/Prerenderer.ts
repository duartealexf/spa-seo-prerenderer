import puppeteer, { Browser, Response } from 'puppeteer';
import { Request } from 'express';

import { Config } from './Config';

interface PrerenderedResponse {
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
class Prerenderer {
  /**
   * Puppeteer browser.
   */
  private browser: Browser;

  public static readonly USER_AGENT = 'prerenderer/{{version}}';

  constructor() {}

  public async start() {
    this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  }

  public async stop() {
    await this.browser.close();
  }

  public async prerender(url: string): Promise<PrerenderedResponse> {
    try {
      // TODO: as in https://github.com/brijeshpant83/bp-pre-puppeteer-node/blob/master/index.js#L200
      // might need to change the url to x-forwarded-host

      const renderStart = Date.now();
      const page = await this.browser.newPage();

      page.setUserAgent(Prerenderer.USER_AGENT);

      // TODO: handle certificate error and continue
      // TODO: follow redirects

      // TODO: create list of url patterns to block request to (i.e. analytics)
      page.on('request', (req) => {
        // Don't load Google Analytics lib requests so pageviews aren't 2x.
        const blacklist = [
          'www.google-analytics.com',
          '/gtag/js',
          'ga.js',
          'analytics.js',
        ];

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

      // tslint:disable-next-line: max-line-length
      // Page.addScriptToEvaluateOnNewDocument({source: 'if (window.customElements) customElements.forcePolyfill = true'})
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
          timeout: Config.getTimeout(),
          waitUntil: 'networkidle0',
        });
      } catch (e) {
        // TODO: do something other than console error.
        console.error(e);
      }

      if (!response) {
        console.error('response does not exist');
        // This should only occur when the page is about:blank. See
        // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
        await page.close();

        return {
          headers: {
            status: 400,
            'X-Prerendered-Ms': Date.now() - renderStart,
          },
          body: '',
        };
      }

      // Disable access to compute metadata. See
      // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
      if (response.headers()['metadata-flavor'] === 'Google') {
        await page.close();
        return {
          headers: {
            status: 403,
            'X-Prerendered-Ms': Date.now() - renderStart,
          },
          body: '',
        };
      }

      // Set status to the initial server's response code. Check for a <meta
      // name="render:status_code" content="4xx" /> tag which overrides the status
      // code.
      let status = response.status();

      const newStatusCode = await page
        .$eval('meta[name="render:status_code"]', (element: Element) =>
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

      return {
        body,
        headers: {
          status,
          'X-Original-Location': url,
          'X-Prerendered-Ms': Date.now() - renderStart,
        },
      };
    } catch (err) {
      console.error(err);
      throw new Error('page.goto/waitForSelector timed out.');
    }
  }

  public async createSnapshot(responseData: PrerenderedResponse) {}

  public isValidURL(url: string): boolean {
    if (!url.match(/^http/)) {
      return true;
    }

    return false;
  }

  public async shouldPrerender(request: Request) {
    const userAgent = request.headers['user-agent'];

    if (!userAgent) {
      return false;
    }

    // TODO: parse url and get only extension
    if (Config.getIgnoredExtensions().includes(request.url)) {
      return false;
    }

    // TODO: add whitelist check
    // TODO: add blacklist check

    if (
      request.method === 'GET' &&
      Config.getBotUserAgents().includes(userAgent.toLowerCase())
    ) {
      return true;
    }

    return false;
  }
}

const singleton = new Prerenderer();
export { singleton as Prerenderer };
