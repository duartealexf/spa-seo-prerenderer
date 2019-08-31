/**
 * Exception thrown when an environment variable is missing.
 */
export class MissingEnvException extends Error {
  public message: string;

  constructor(env: string) {
    super(
      `${env} environment property is required but it is not set! ` +
        `Make sure you have a .env file and ${env} is set correctly!`,
    );
    this.name = this.constructor.name;

    this.message =
      `${env} environment property is required but it is not set! ` +
      `Make sure you have a .env file and ${env} is set correctly!`;
  }

  toString(): string {
    return this.message;
  }
}
