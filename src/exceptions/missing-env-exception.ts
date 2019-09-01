/**
 * Exception thrown when a required environment variable is missing.
 */
export class MissingEnvException extends Error {
  public message: string;

  constructor(env: string) {
    super(
      `${env} environment property is required but it is not set! ` +
        `Make sure you have a .env file and ${env} is set correctly, ` +
        'or that you have provided a value for it in Prerenderer construct!',
    );
    this.name = this.constructor.name;

    this.message =
      `${env} environment property is required but it is not set! ` +
      `Make sure you have a .env file and ${env} is set correctly, ` +
      'or that you have provided a value for it in Prerenderer construct!';
  }

  toString(): string {
    return this.message;
  }
}
