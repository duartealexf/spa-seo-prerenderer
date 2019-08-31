/**
 * Exception thrown when an environment variable has a
 * value that is different from the preset, correct ones.
 */
export class MismatchingEnvException extends Error {
  public message: string;

  constructor(varName: string, currentValue: string, correctValues: string[]) {
    super(
      `${varName} must be one of: [${correctValues.join(
        ' | ',
      )}]. It is currently set as '${currentValue}', which is not correct.`,
    );

    this.name = this.constructor.name;

    this.message = `${varName} must be one of: [${correctValues.join(
      ' | ',
    )}]. It is currently set as '${currentValue}', which is not correct.`;
  }

  toString(): string {
    return this.message;
  }
}
