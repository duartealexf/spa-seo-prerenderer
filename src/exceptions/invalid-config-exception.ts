/**
 * Exception thrown when a config variable has an invalid value.
 */
export class InvalidConfigException extends Error {
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
