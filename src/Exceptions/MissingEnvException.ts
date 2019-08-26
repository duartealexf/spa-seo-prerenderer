export class MissingEnvException {
  private message: string;

  constructor(env: string) {
    this.message =
      `${env} environment property is required but it is not set! ` +
      `Make sure you have a .env file and ${env} is set correctly!`;
  }

  toString() {
    return this.message;
  }
}
