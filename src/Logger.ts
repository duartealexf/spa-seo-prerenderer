import winston from 'winston';

import { Config } from './Config';
import { PrerendererNotReadyException } from './Exceptions/PrerendererNotReadyException';

export class Logger {
  /**
   * Logging context.
   */
  private readonly context = 'prerenderer';

  /**
   * Winston logger instance.
   */
  private logger: winston.Logger;

  /**
   * Config singleton.
   */
  private config: Config;

  constructor(config: Config) {
    this.config = config;

    this.logger = winston.createLogger({
      /**
       * Set warning level for production, debug level for development.
       */
      level: this.config.isProductionEnv() ? 'warning' : 'debug',
      format: winston.format.simple(),
      defaultMeta: this.context,
    });

    if (!this.config.isInitialized()) {
      throw new PrerendererNotReadyException(
        'Prerenderer config has not been initialized. Did you run prerenderer.initialize()?',
      );
    }

    if (this.config.getPrerendererLogFile()) {
      this.logger.add(
        new winston.transports.File({
          filename: this.config.getPrerendererLogFile(),
        }),
      );
    }

    if (!this.config.isProductionEnv()) {
      /**
       * Additional console logging for development.
       */
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      );
    }
  }

  /**
   * Log a level 0 message.
   */
  public emerg(message: string): void {
    this.logger.emerg(message);
  }

  /**
   * Log a level 1 message.
   */
  public alert(message: string): void {
    this.logger.alert(message);
  }

  /**
   * Log a level 2 message.
   */
  public crit(message: string): void {
    this.logger.crit(message);
  }

  /**
   * Log a level 3 message.
   */
  public error(message: string): void {
    this.logger.error(message);
  }

  /**
   * Log a level 4 message.
   */
  public warning(message: string): void {
    this.logger.warning(message);
  }

  /**
   * Log a level 5 message.
   */
  public notice(message: string): void {
    this.logger.notice(message);
  }

  /**
   * Log a level 6 message.
   */
  public info(message: string): void {
    this.logger.info(message);
  }

  /**
   * Log a level 7 message.
   */
  public debug(message: string): void {
    this.logger.debug(message);
  }
}
