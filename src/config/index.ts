import { join } from 'path';

import { InvalidConfigException } from '../exceptions/invalid-config-exception';
import {
  PrerendererConfig,
  NodeEnvironment,
  DEFAULT_PRERENDERABLE_EXTENSIONS,
  DEFAULT_BOT_USER_AGENTS,
  DEFAULT_BLACKLISTED_REQUEST_URLS,
  DatabaseOptions,
  DEFAULT_IGNORED_QUERY_PARAMETERS,
} from './defaults';

export class Config {
  /**
   * Values passed in from constructor.
   */
  private constructSettings: PrerendererConfig;

  /**
   * NodeJS environment.
   */
  private nodeEnvironment: NodeEnvironment = 'production';

  /**
   * Database connection options.
   */
  private databaseOptions!: DatabaseOptions;

  /**
   * Marimum cache age, in days.
   */
  private cacheMaxAge = 7;

  /**
   * URL query parameters that are discarded before prerendering.
   */
  private ignoredQueryParameters = DEFAULT_IGNORED_QUERY_PARAMETERS;

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
   * Network URL part whitelist set from config.
   */
  private whitelistedRequestURLs: string[] = [];

  /**
   * Network URL part blacklist set from config.
   */
  private blacklistedRequestURLs: string[] = DEFAULT_BLACKLISTED_REQUEST_URLS;

  constructor(config: PrerendererConfig) {
    this.constructSettings = { ...config };
    this.validateAndAssignConfigValues();
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
     * Validate database options.
     */
    if (typeof c.databaseOptions !== 'object') {
      throw new InvalidConfigException('databaseOptions given in constructor must be an object!');
    }
    if (!Object.keys(c.databaseOptions).length) {
      throw new InvalidConfigException(
        "databaseOptions given in constructor must contain database credentials using either the 'url' format or at least 'host', 'username', and 'database'!",
      );
    }
    this.databaseOptions = c.databaseOptions;

    /**
     * Setup cacheMaxAge config.
     */
    c.cacheMaxAge = typeof c.cacheMaxAge === 'undefined' ? this.cacheMaxAge : c.cacheMaxAge;

    if (typeof c.cacheMaxAge !== 'number') {
      throw new InvalidConfigException('cacheMaxAge given in constructor must be a number!');
    }
    this.cacheMaxAge = c.cacheMaxAge;

    /**
     * Setup ignoredQueryParameters config.
     */
    if (typeof c.ignoredQueryParameters !== 'undefined') {
      const ignoredQueryParameters = c.ignoredQueryParameters as string[];

      if (
        !Array.isArray(ignoredQueryParameters) ||
        ignoredQueryParameters.some((v) => typeof v !== 'string')
      ) {
        throw new InvalidConfigException(
          'ignoredQueryParameters given in constructor must be of type string[]! Make sure all values in array are strings!',
        );
      }

      this.ignoredQueryParameters = ignoredQueryParameters;
    }

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
          'prerenderableExtensions given in constructor must be of type string[]! Make sure all values in array are strings!',
        );
      }

      this.prerenderableExtensions = extensions;
    }

    if (typeof c.botUserAgents !== 'undefined') {
      const userAgents = c.botUserAgents as string[];

      if (!Array.isArray(userAgents) || userAgents.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'botUserAgents given in constructor must be of type string[]! Make sure all values in array are strings!',
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
          'whitelistedRequestURLs given in constructor must be of type string[]! Make sure all values in array are strings!',
        );
      }

      this.whitelistedRequestURLs = whitelist;
    }

    if (typeof c.blacklistedRequestURLs !== 'undefined') {
      const blacklist = c.blacklistedRequestURLs as string[];

      if (!Array.isArray(blacklist) || blacklist.some((v) => typeof v !== 'string')) {
        throw new InvalidConfigException(
          'blacklistedRequestURLs given in constructor must be of type string[]! Make sure all values in array are strings!',
        );
      }

      this.blacklistedRequestURLs = blacklist;
    }
  }

  /**
   * Whether this is running in production environment.
   */
  public isProductionEnv(): boolean {
    return this.nodeEnvironment === 'production';
  }

  /**
   * Get database options.
   */
  public getDatabaseOptions(): DatabaseOptions {
    return this.databaseOptions;
  }

  /**
   * Get cache maximum age.
   */
  public getCacheMaxAge(): number {
    return this.cacheMaxAge;
  }

  /**
   * Get configured ignored query parameters.
   */
  public getIgnoredQueryParameters(): string[] {
    return this.ignoredQueryParameters;
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
