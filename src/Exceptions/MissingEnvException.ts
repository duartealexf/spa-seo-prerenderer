/**
 * Exception thrown when an environment variable is missing.
 */
export class MissingEnvException extends Error {
  public message: string;

  constructor(env: string) {
    super(env);
    this.name = this.constructor.name;
    this.message =
      `${env} environment property is required but it is not set! ` +
      `Make sure you have a .env file and ${env} is set correctly!`;
  }

  toString() {
    return this.message;
  }
}
