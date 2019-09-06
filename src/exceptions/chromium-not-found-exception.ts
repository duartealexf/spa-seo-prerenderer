/**
 * Exception thrown when Chromium is not found in given path.
 */
export class ChromiumNotFoundException extends Error {
  public message: string;

  constructor(path: string) {
    super(`Chromium binary was not found in path ${path}!`);
    this.name = this.constructor.name;
    this.message = `Chromium binary was not found in path ${path}!`;
  }

  toString(): string {
    return this.message;
  }
}
