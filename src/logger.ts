/* eslint-disable no-console */
import { WriteStream, createWriteStream } from 'fs';
import debug from 'debug';

import { Config } from './config';
import { PrerendererNotReadyException } from './exceptions/prerenderer-not-ready-exception';

export class Logger {
  private static readonly LOG_LEVELS = [
    'emerg',
    'alert',
    'crit',
    'error',
    'warning',
    'notice',
    'info',
    'debug',
  ];

  private static readonly LOG_LEVEL_EMERG = 0;

  private static readonly LOG_LEVEL_ALERT = 1;

  private static readonly LOG_LEVEL_CRIT = 2;

  private static readonly LOG_LEVEL_ERROR = 3;

  private static readonly LOG_LEVEL_WARNING = 4;

  private static readonly LOG_LEVEL_NOTICE = 5;

  private static readonly LOG_LEVEL_INFO = 6;

  private static readonly LOG_LEVEL_DEBUG = 7;

  /**
   * Config singleton.
   */
  private config: Config;

  /**
   * Log level set.
   */
  private logLevel = Logger.LOG_LEVEL_WARNING;

  /**
   * File to append the log to.
   */
  private logFile?: WriteStream;

  constructor(config: Config) {
    this.config = config;

    this.logLevel = this.config.isProductionEnv()
      ? Logger.LOG_LEVEL_WARNING
      : Logger.LOG_LEVEL_DEBUG;

    if (!this.config.isInitialized()) {
      throw new PrerendererNotReadyException(
        'Prerenderer config has not been initialized. Did you run prerenderer.initialize()?',
      );
    }

    if (this.config.getPrerendererLogFile()) {
      this.logFile = createWriteStream(config.getPrerendererLogFile(), {
        encoding: 'utf-8',
      });

      this.logFile.on('error', (error) => {
        if (this.logFile) {
          this.logFile.close();
        }
        this.error(`Error writing to log file: ${error.message}`, 'logger');
      });
    }
  }

  /**
   * Log a level 0 message.
   */
  public emerg(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_EMERG, message, context);
  }

  /**
   * Log a level 1 message.
   */
  public alert(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_ALERT, message, context);
  }

  /**
   * Log a level 2 message.
   */
  public crit(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_CRIT, message, context);
  }

  /**
   * Log a level 3 message.
   */
  public error(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_ERROR, message, context);
  }

  /**
   * Log a level 4 message.
   */
  public warning(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_WARNING, message, context);
  }

  /**
   * Log a level 5 message.
   */
  public notice(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_NOTICE, message, context);
  }

  /**
   * Log a level 6 message.
   */
  public info(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_INFO, message, context);
  }

  /**
   * Log a level 7 message.
   */
  public debug(message: string, context: string): void {
    this.log(Logger.LOG_LEVEL_DEBUG, message, context);
  }

  /**
   * Log a message to file and/or console.
   * @param logLevel
   * @param message
   * @param context
   */
  private log(logLevel: number, message: string, context = ''): void {
    if (this.logLevel < logLevel) {
      return;
    }

    const formattedMessage = Logger.formatMessage(logLevel, message, context);

    if (this.logFile && this.logFile.writable) {
      this.logFile.write(`${formattedMessage}\n`);
    }

    if (logLevel <= Logger.LOG_LEVEL_ERROR) {
      console.error(formattedMessage);
    } else if (logLevel === Logger.LOG_LEVEL_WARNING) {
      console.warn(formattedMessage);
    } else if (debug.enabled('prerenderer')) {
      /**
       * Workaround for debug's bug of not printing when
       * debugging, forward message to console.
       */
      console.log(formattedMessage);
    }
  }

  /**
   * Format a log message prior to output.
   * @param logLevel
   * @param message
   * @param context
   */
  private static formatMessage(logLevel: number, message: string, context: string): string {
    return `${new Date().toISOString()} prerenderer:${context} ${Logger.LOG_LEVELS[logLevel] ||
      ''}: ${message}`;
  }
}
