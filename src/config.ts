import { join } from 'path';

import { InvalidConfigException } from './exceptions/invalid-config-exception';
import { MismatchingConfigException } from './exceptions/mismatching-config-exception';
import { Filesystem } from './filesystem/filesystem';
import {
  PrerendererConfigParams,
  NodeEnvironment,
  FilesystemDriver,
  DEFAULT_PRERENDERABLE_EXTENSIONS,
  DEFAULT_BOT_USER_AGENTS,
  DEFAULT_BLACKLISTED_REQUEST_URLS,
  CORRECT_SNAPSHOTS_DRIVERS,
} from './config/defaults';

export class Config {
  /**
   * Values passed in from constructor.
   */
  private constructSettings: PrerendererConfigParams;

  /**
   * NodeJS environment.
   */
  private nodeEnvironment: NodeEnvironment = 'production';

  /**
   * Chosen filesystem driver.
   */
  private filesystemDriver: FilesystemDriver = 'fs';

  /**
   * Directory to store snapshots in.
   */
  private snapshotsDirectory = './snapshots';

  /**
   * Prerenderer log file location.
   */
  private prerendererLogFile = '';

  /**
   * Chromium executable
   */
  private chromiumExecutable = '';

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
    this.constructSettings = { ...config };
    this.validateAndAssignConfigValues();
  }

  /**
   * Initialize configuration, which is required before starting app.
   */
  public async initialize(): Promise<void> {
    await this.initSnapshotConfig();
    await this.initLoggingConfig();

    this.initialized = true;
  }

  /**
   * Assign values from construct settings to this config instance.
   */
  private validateAndAssignConfigValues(): void {
    const c = this.constructSettings;

    /**
     * Setup nodeEnv config.
     */
    c.nodeEnv = typeof c.nodeEnv === 'undefined' ? this.nodeEnvironment : c.nodeEnv;

    if (typeof c.nodeEnv !== 'string') {
      throw new InvalidConfigException('nodeEnv given in constructor must be a string!');
    }
    this.nodeEnvironment = c.nodeEnv;

    /**
     * Setup filesystemDriver config.
     */
    c.filesystemDriver =
      typeof c.filesystemDriver === 'undefined' ? this.filesystemDriver : c.filesystemDriver;

    if (!Config.isCorrectFilesystemDriver(c.filesystemDriver)) {
      throw new MismatchingConfigException(
        'filesystemDriver',
        c.filesystemDriver,
        CORRECT_SNAPSHOTS_DRIVERS,
      );
    }
    this.filesystemDriver = c.filesystemDriver;

    /**
     * Setup snapshotsDirectory config.
     */
    c.snapshotsDirectory =
      typeof c.snapshotsDirectory === 'undefined' ? this.snapshotsDirectory : c.snapshotsDirectory;

    if (typeof c.snapshotsDirectory !== 'string') {
      throw new InvalidConfigException('snapshotsDirectory must be a string.');
    }

    if (c.filesystemDriver === 's3') {
      if (!(c.snapshotsDirectory as string).startsWith('/')) {
        throw new InvalidConfigException(
          "snapshotsDirectory must start with '/' when filesystemDriver is 's3'.",
        );
      }
    } else {
      /**
       * Make the directory absolute.
       */
      c.snapshotsDirectory = c.snapshotsDirectory.startsWith('/')
        ? c.snapshotsDirectory
        : join(process.cwd(), c.snapshotsDirectory);
    }
    this.snapshotsDirectory = c.snapshotsDirectory;

    /**
     * Setup prerendererLogFile config.
     */
    c.prerendererLogFile = typeof c.prerendererLogFile === 'undefined' ? '' : c.prerendererLogFile;

    if (typeof c.prerendererLogFile !== 'string') {
      throw new InvalidConfigException('prerendererLogFile must be a string.');
    }

    if (c.prerendererLogFile.length) {
      /**
       * Make the directory absolute.
       */
      c.prerendererLogFile = c.prerendererLogFile.startsWith('/')
        ? c.prerendererLogFile
        : join(process.cwd(), c.prerendererLogFile);
    }
    this.prerendererLogFile = c.prerendererLogFile;

    /**
     * Setup chromiumExecutable config.
     */
    this.chromiumExecutable =
      typeof c.chromiumExecutable === 'undefined' ? '' : c.chromiumExecutable;

    /**
     * Setup prerenderablePathRegExps config.
     */
    if (typeof c.prerenderablePathRegExps !== 'undefined') {
      const regexps = c.prerenderablePathRegExps as RegExp[];

      if (!Array.isArray(regexps) || regexps.some((v) => !(v instanceof RegExp))) {
        throw new InvalidConfigException(
          'prerenderablePathRegExps given in constructor must be of type RegExp[]!',
        );
      }

      this.prerenderablePathRegExps = regexps;
    }

    if (typeof c.prerenderableExtensions !== 'undefined') {
      const extensions = c.prerenderableExtensions as string[];

      if (!Array.isArray(extensions) || extensions.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'prerenderableExtensions given in constructor must be of type string[]!',
        );
      }

      this.prerenderableExtensions = extensions;
    }

    if (typeof c.botUserAgents !== 'undefined') {
      const userAgents = c.botUserAgents as string[];

      if (!Array.isArray(userAgents) || userAgents.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'botUserAgents given in constructor must be of type string[]!',
        );
      }

      this.botUserAgents = userAgents.map((u) => u.toLowerCase());
    }

    if (typeof c.timeout !== 'undefined') {
      const timeout = c.timeout as number;

      if (typeof timeout !== 'number' || timeout <= 0) {
        throw new InvalidConfigException(
          'timeout given in constructor must be a number greater than zero!',
        );
      }

      this.timeout = timeout;
    }

    if (typeof c.whitelistedRequestURLs !== 'undefined') {
      const whitelist = c.whitelistedRequestURLs as string[];

      if (!Array.isArray(whitelist) || whitelist.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'whitelistedRequestURLs given in constructor must be of type string[]!',
        );
      }

      this.whitelistedRequestURLs = whitelist;
    }

    if (typeof c.blacklistedRequestURLs !== 'undefined') {
      const blacklist = c.blacklistedRequestURLs as string[];

      if (!Array.isArray(blacklist) || blacklist.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'blacklistedRequestURLs given in constructor must be of type string[]!',
        );
      }

      this.blacklistedRequestURLs = blacklist;
    }
  }

  /**
   * Initialize snapshots configuration.
   */
  private async initSnapshotConfig(): Promise<void> {
    if (this.filesystemDriver === 'fs') {
      /**
       * Ensure directory exists.
       */
      await Filesystem.ensureDir(this.snapshotsDirectory);
    }
  }

  /**
   * Initialize logging configuration.
   */
  private async initLoggingConfig(): Promise<void> {
    if (!this.prerendererLogFile) {
      return;
    }

    /**
     * Ensure file exists and is writeable.
     */
    await Filesystem.ensureFile(this.prerendererLogFile);
  }

  /**
   * Whether given filesystem driver is correct.
   * @param driver
   */
  private static isCorrectFilesystemDriver(
    driver: FilesystemDriver | undefined,
  ): driver is FilesystemDriver {
    return CORRECT_SNAPSHOTS_DRIVERS.includes(driver as string);
  }

  /**
   * Whether configuration has been initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Getter for filesystem driver.
   */
  public getFilesystemDriver(): string {
    return this.filesystemDriver;
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
   * Get path to Chromium binary.
   */
  public getChromiumExecutable(): string | undefined {
    return this.chromiumExecutable;
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
