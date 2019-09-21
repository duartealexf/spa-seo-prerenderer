import { join } from 'path';

import { MissingEnvException } from './exceptions/missing-env-exception';
import { InvalidConfigException } from './exceptions/invalid-config-exception';
import { MismatchingConfigException } from './exceptions/mismatching-config-exception';
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
  private constructSettings: PrerendererConfigParams;

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
   * Chromium executable
   */
  private chromiumExecutable?: string;

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
    this.constructSettings = {
      nodeEnv: process.env.NODE_ENV || 'production',
      snapshotsDriver: process.env.SNAPSHOTS_DRIVER || 'fs',
      snapshotsDirectory: process.env.SNAPSHOTS_DIRECTORY || '../snapshots',
      prerendererLogFile: process.env.PRERENDERER_LOG_FILE || '',
      chromiumExecutable: process.env.CHROMIUM_EXECUTABLE,
      ...config,
    };

    this.checkRequiredConfig();
    this.validateAndAssignConfigValues();
  }

  /**
   * Initialize configuration, which is required before starting app.
   */
  public async initialize(): Promise<void> {
    await this.initSnapshotConfig();
    await this.initLoggingConfig();

    this.chromiumExecutable = this.constructSettings.chromiumExecutable;

    this.initialized = true;
  }

  /**
   * Check that all required configuration is set.
   */
  private checkRequiredConfig(): void {
    const c = this.constructSettings;

    ['nodeEnv', 'snapshotsDriver', 'snapshotsDirectory'].forEach((env) => {
      if (!c[env] || (typeof c[env] === 'string' && !(c[env] as string).length)) {
        throw new MissingEnvException(env);
      }
    });
  }

  /**
   * Assign values from construct settings to this config instance.
   */
  private validateAndAssignConfigValues(): void {
    const c = this.constructSettings;

    if (c.nodeEnv && c.nodeEnv.length) {
      this.nodeEnvironment = c.nodeEnv;
    }

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
    const snapshotsDriver: SnapshotsDriver = this.constructSettings
      .snapshotsDriver as SnapshotsDriver;
    let snapshotsDirectory: string = this.constructSettings.snapshotsDirectory;

    const correctDrivers = ['fs', 's3'];

    if (!correctDrivers.includes(snapshotsDriver)) {
      throw new MismatchingConfigException(
        'snapshotsDriver',
        this.constructSettings.nodeEnv as string,
        correctDrivers,
      );
    }

    if (snapshotsDriver === 's3') {
      if (/^\.|^\//.test(snapshotsDirectory)) {
        throw new InvalidConfigException(
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
    if (!this.constructSettings.prerendererLogFile) {
      return;
    }

    /**
     * Make the directory absolute.
     */
    const logFile = this.constructSettings.prerendererLogFile.startsWith('/')
      ? this.constructSettings.prerendererLogFile
      : join(process.cwd(), this.constructSettings.prerendererLogFile);

    /**
     * Ensure file exists and is writeable.
     */
    await Filesystem.ensureFile(logFile);

    this.prerendererLogFile = logFile;
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
