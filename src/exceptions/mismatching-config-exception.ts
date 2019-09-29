/**
 * Exception thrown when a config variable has a value
 * that is different from the preset, correct ones.
 */
export class MismatchingConfigException extends Error {
  public message: string;

  constructor(varName: string, currentValue: string | undefined, correctValues: string[]) {
    super(
      `Config variable ${varName} must be one of: [${correctValues.join(
        ' | ',
      )}]. It is currently set as '${currentValue}', which is not correct.`,
    );

    this.name = this.constructor.name;

    this.message = `Config variable ${varName} must be one of: [${correctValues.join(
      ' | ',
    )}]. It is currently set as '${currentValue}', which is not correct.`;
  }

  toString(): string {
    return this.message;
  }
}
