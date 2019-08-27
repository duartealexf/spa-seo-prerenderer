export class InvalidEnvException extends Error {
  public message: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
  }

  toString() {
    return this.message;
  }
}
