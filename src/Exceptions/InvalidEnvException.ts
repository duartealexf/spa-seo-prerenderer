/**
 * Exception thrown when an environment variable has an invalid value.
 */
export class InvalidEnvException extends Error {
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
