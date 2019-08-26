export class InvalidEnvException {
  private message: string;

  constructor(message: string) {
    this.message = message;
  }

  toString() {
    return this.message;
  }
}
