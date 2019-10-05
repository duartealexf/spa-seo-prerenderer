/**
 * Exception throw by Prerenderer when Puppeteer has empty
 * response or anything out of the ordinary happens.
 */
export class PuppeteerException extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
