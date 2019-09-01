import { join } from 'path';

import { MissingEnvException } from './Exceptions/MissingEnvException';
import { InvalidEnvException } from './Exceptions/InvalidEnvException';
import { MismatchingEnvException } from './Exceptions/MismatchingEnvException';
import { Filesystem } from './Filesystem/Filesystem';

/**
 * Correct values for snapshots driver environment config.
 */
export type SnapshotsDriver = 'fs' | 's3';

/**
 * NodeJS environment config.
 */
export type NodeEnvironment = 'development' | 'production' | string | undefined;

/**
 * Interface for needed values as in process.env.
 */
export interface PrerendererConfigParams {
  [key: string]: number | string | string[] | RegExp[] | undefined;

  /**
   * NodeJS environment.
   * @default 'production'
   */
  nodeEnv?: NodeEnvironment;

  /**
   * Chosen snapshots driver.
   * @default 'fs'
   */
  snapshotsDriver: SnapshotsDriver;

  /**
   * Directory to store snapshots in.
   * @default '../snapshots'
   */
  snapshotsDirectory: string;

  /**
   * Prerenderer log file location. Not specifying any will make it not log to a file.
   * @default ''
   */
  prerendererLogFile?: string;

  /**
   * Array of path RegExps that, when matched
   * to request path, will activate Prerenderer.
   * @default [new RegExp('.*')]
   */
  prerenderablePathRegExps: RegExp[];

  /**
   * Case insensitive list of extensions that, when matched
   * to request path, will activate Prerenderer.
   * @default DEFAULT_PRERENDERABLE_EXTENSIONS
   */
  prerenderableExtensions?: string[];

  /**
   * Case insensitive list of user agents that, when matched
   * to request user agent, will activate Prerenderer.
   * @default DEFAULT_BOT_USER_AGENTS
   */
  botUserAgents?: string[];

  /**
   * Puppeteer's timeout (in ms).
   * @default 10000
   */
  timeout?: number;

  /**
   * Case insensitive list with URL parts that Puppeteer will exclusively allow the rendering
   * page to make requests to. Defaults to an empty array. If any URL part is added to this
   * list, Puppeteer will only consider this whitelist and ignore blacklistedRequestURLs.
   * @default []
   */
  whitelistedRequestURLs?: string[];

  /**
   * Case insensitive list with URL parts that Puppeteer will disallow the rendering page to
   * make requests to. Useful for disallowing the prerendered page to make network requests
   * to, e.g. services like Google Analytics, GTM, chat services, Facebook, Hubspot, etc.
   * @default DEFAULT_BLACKLISTED_REQUEST_URLS
   */
  blacklistedRequestURLs?: string[];
}

export const DEFAULT_BOT_USER_AGENTS = [
  'googlebot',
  'yahoo! slurp',
  'bingbot',
  'yandex',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'google page speed',
  'qwantify',
  'pinterestbot',
  'bitrix link preview',
  'xing-contenttabreceiver',
  'chrome-lighthouse',
  'x-bufferbot',
];

/**
 * Some of this from https://www.thirdpartyweb.today
 */
export const DEFAULT_BLACKLISTED_REQUEST_URLS = [
  'doubleclick.net', // Google
  'adservice.google', // Google
  '.googleadservices.', // Google
  'google-analytics', // Google
  'google.com/pagead', // Google
  'ga.js', // Google
  'gtm.js', // Google
  '.googleapis.', // Google
  'connect.facebook.net', // Facebook
  '.facebook.com/tr', // Facebook
  '.addthis.com', // Twitter
  'static.ads-twitter.', // Twitter
  '/scevent.', // Snapchat
  '.zdassets.', // ZenDesk
  'assets.zendesk.com', // ZenDesk
  '.collect.igodigital.', // Salesforce

  '/collect.js', // common tracking pattern
  '/analytics.js', // common tracking pattern
  '/tracking.js', // common tracking pattern
  '/collect.min.js', // common tracking pattern
  '/analytics.min.js', // common tracking pattern
  '/tracking.min.js', // common tracking pattern

  '.tawk.to', // Tawk
  '.zopim.', // Zopim
  '.yandex.', // Yandex
  '.luckyorange.', // Lucky Orange
  '.criteo.', // Criteo
  '.hotjar.', // Hotjar
  '.onesignal.', // OneSignal
  '.tiqcdn.', // Tealium
  '.intercom.com', // Intercom
  '.lunametrics.', // Bounteous
  '.calltrackingmetrics.', // Call Tracking Metrics

  // Less common and low impact ones.
  // '.bounteous.', // Bounteous
  // 'callsumo.com', // Sumo
  // 'sumo.com', // Sumo
  // 'media.net', // Media.net
  // '.pubmine.', // Pubmine
  // '.moatads.', // Moat Ads
  // '.histats.', // Histats
  // '.exoclick.', // Exoclick
  // '.pubmatic.', // Pubmatic
  // '.linksynergy.', // Linksynergy
  // '.scorecardresearch.', // Score Card Research
  // '.gemius.', // Gemius
  // '.outbrain.', // Outbrain
];

export const DEFAULT_PRERENDERABLE_EXTENSIONS = [
  '',
  '.html',
  '.php',
];

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
  private timeout = 60000;

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
