import { join } from 'path';

import { MissingEnvException } from './exceptions/missing-env-exception';
import { InvalidEnvException } from './exceptions/invalid-env-exception';
import { MismatchingEnvException } from './exceptions/mismatching-env-exception';
import { Filesystem } from './filesystem/filesystem';
import {
  PrerendererConfigParams,
  NodeEnvironment,
  SnapshotsDriver,
  DEFAULT_PRERENDERABLE_EXTENSIONS,
  DEFAULT_BOT_USER_AGENTS,
  DEFAULT_BLACKLISTED_REQUEST_URLS,
} from './config/defaults';

export class Config {
  /**
   * Values as in process.env.
   */
  private config: PrerendererConfigParams;

  /**
   * NodeJS environment.
   */
  private nodeEnvironment: NodeEnvironment = 'production';

  /**
   * Chosen snapshots driver.
   */
  private snapshotsDriver: SnapshotsDriver = 'fs';

  /**
   * Directory to store snapshots in.
   */
  private snapshotsDirectory = '../snapshots';

  /**
   * Prerenderer log file location.
   */
  private prerendererLogFile = '';

  /**
   * Array of path RegExps that, when matched
   * to request path, will activate Prerenderer.
   */
  private prerenderablePathRegExps: RegExp[] = [/.*/];

  /**
   * Case insensitive list of extensions that, when matched
   * to request path, will activate Prerenderer.
   */
  private prerenderableExtensions: string[] = DEFAULT_PRERENDERABLE_EXTENSIONS;

  /**
   * Case insensitive list of user agents that, when matched
   * to request user agent, will activate Prerenderer.
   */
  private botUserAgents: string[] = DEFAULT_BOT_USER_AGENTS;

  /**
   * Puppeteer's timeout (in ms).
   */
  private timeout = 10000;

  /**
   * Case insensitive list with URL parts that Puppeteer will exclusively allow the rendering
   * page to make requests to. Defaults to an empty array. If any URL part is added to this
   * list, Puppeteer will only consider this whitelist and ignore blacklistedRequestURLs.
   */
  private whitelistedRequestURLs: string[] = [];

  /**
   * Case insensitive list with URL parts that Puppeteer will disallow the rendering page to
   * make requests to. Useful for disallowing the prerendered page to make network requests
   * to, e.g. services like Google Analytics, GTM, chat services, Facebook, Hubspot, etc.
   */
  private blacklistedRequestURLs: string[] = DEFAULT_BLACKLISTED_REQUEST_URLS;

  /**
   * Whether config has been initialized.
   */
  private initialized = false;

  constructor(config: PrerendererConfigParams) {
    this.config = {
      nodeEnv: process.env.NODE_ENV || 'production',
      snapshotsDriver: process.env.SNAPSHOTS_DRIVER || 'fs',
      snapshotsDirectory: process.env.SNAPSHOTS_DIRECTORY || '../snapshots',
      prerendererLogFile: process.env.PRERENDERER_LOG_FILE || '',
      ...config,
    };
  }

  /**
   * Initialize configuration, which is required before starting app.
   */
  public async initialize(): Promise<void> {
    this.checkRequiredConfig();
    await this.initSnapshotConfig();
    await this.initLoggingConfig();
    this.initEnvironmentConfig();

    this.initialized = true;
  }

  /**
   * Check that all required configuration is set.
   */
  private checkRequiredConfig(): void {
    ['nodeEnv', 'snapshotsDriver', 'snapshotsDirectory'].forEach((env) => {
      if (
        !this.config[env] ||
        (typeof this.config[env] === 'string' && !(this.config[env] as string).length)
      ) {
        throw new MissingEnvException(env);
      }
    });
  }

  /**
   * Initialize snapshots configuration.
   */
  private async initSnapshotConfig(): Promise<void> {
    const snapshotsDriver: SnapshotsDriver = this.config.snapshotsDriver as SnapshotsDriver;
    let snapshotsDirectory: string = this.config.snapshotsDirectory;

    const correctDrivers = ['fs', 's3'];

    if (!correctDrivers.includes(snapshotsDriver)) {
      throw new MismatchingEnvException(
        'snapshotsDriver',
        this.config.nodeEnv as string,
        correctDrivers,
      );
    }

    if (snapshotsDriver === 's3') {
      if (/^\.|^\//.test(snapshotsDirectory)) {
        throw new InvalidEnvException(
          "snapshotsDirectory cannot start with '.' or '/' when snapshotsDriver is 's3'. Adjust it to choose to a valid relative directory in s3.",
        );
      }
    } else {
      /**
       * Make the directory absolute.
       */
      snapshotsDirectory = snapshotsDirectory.startsWith('/')
        ? snapshotsDirectory
        : join(process.cwd(), snapshotsDirectory);
    }

    if (snapshotsDriver === 'fs') {
      /**
       * Ensure directory exists.
       */
      await Filesystem.ensureDir(snapshotsDirectory);
    }

    this.snapshotsDriver = snapshotsDriver;
    this.snapshotsDirectory = snapshotsDirectory;
  }

  /**
   * Initialize logging configuration.
   */
  private async initLoggingConfig(): Promise<void> {
    if (!this.config.prerendererLogFile) {
      return;
    }

    /**
     * Make the directory absolute.
     */
    const logFile = this.config.prerendererLogFile.startsWith('/')
      ? this.config.prerendererLogFile
      : join(process.cwd(), this.config.prerendererLogFile);

    /**
     * Ensure file is exists and is writeable.
     */
    await Filesystem.ensureFile(logFile);

    this.prerendererLogFile = logFile;
  }

  /**
   * Initialize other environment configurations.
   */
  private initEnvironmentConfig(): void {
    this.nodeEnvironment = this.config.nodeEnv;
  }

  /**
   * Whether configuration has been initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Getter for snapshots driver.
   */
  public getSnapshotsDriver(): string {
    return this.snapshotsDriver;
  }

  /**
   * Getter for snapshots directory.
   */
  public getSnapshotsDirectory(): string {
    return this.snapshotsDirectory;
  }

  /**
   * Whether this is running in production environment.
   */
  public isProductionEnv(): boolean {
    return this.nodeEnvironment === 'production';
  }

  /**
   * Get prerenderer log file location.
   */
  public getPrerendererLogFile(): string {
    return this.prerendererLogFile;
  }

  /**
   * Get path RegExps that Prerenderer should handle.
   */
  public getPrerenderablePathRegExps(): RegExp[] {
    return this.prerenderablePathRegExps;
  }

  /**
   * Get extensions list that Prerenderer should handle.
   */
  public getPrerenderableExtensions(): string[] {
    return this.prerenderableExtensions;
  }

  /**
   * Get configured Bot user agents.
   */
  public getBotUserAgents(): string[] {
    return this.botUserAgents;
  }

  /**
   * Get configured Puppeteer timeout.
   */
  public getTimeout(): number {
    return this.timeout;
  }

  /**
   * Get whitelisted URL parts for Puppeteer network requests.
   */
  public getWhitelistedRequestURLs(): string[] {
    return this.whitelistedRequestURLs;
  }

  /**
   * Get blacklisted URL parts for Puppeteer network requests.
   */
  public getBlacklistedRequestURLs(): string[] {
    return this.blacklistedRequestURLs;
  }
}
