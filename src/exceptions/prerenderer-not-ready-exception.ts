/**
 * Exception thrown when attempting to prerender or
 * start the prerenderer when it is not ready yet.
 */
export class PrerendererNotReadyException extends Error {
  public message: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
  }

  toString(): string {
    return this.message;
  }
}
