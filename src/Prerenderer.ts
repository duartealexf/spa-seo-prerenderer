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

  // TODO: add version
  public static readonly USER_AGENT = 'prerenderer/0.0.';

  constructor() {}

  public async start() {
    this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  }

  public async stop() {
    await this.browser.close();
  }

  public async prerender(url: string): Promise<PrerenderedResponse> {
    try {
      const renderStart = Date.now();
      const page = await this.browser.newPage();

      page.setUserAgent(Prerenderer.USER_AGENT);

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
