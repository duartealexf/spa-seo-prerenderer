import dotenv from 'dotenv';
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
  [key: string]: string | string[] | undefined;

  /**
   * NodeJS environment.
   */
  nodeEnv?: NodeEnvironment;

  /**
   * Chosen snapshots driver.
   */
  snapshotsDriver: SnapshotsDriver;

  /**
   * Directory to store snapshots in.
   */
  snapshotsDirectory: string;

  /**
   * Prerenderer log file location.
   */
  prerendererLogFile?: string;

  /**
   * Blacklisted paths (do not prerender matching patterns).
   */
  prerendererBlacklistedPaths?: string[];

  /**
   * Blacklist paths (do prerender matching patterns).
   */
  prerendererWhitelistedPaths?: string[];
}

export class Config {
  /**
   * Prerenderer log file location.
   */
  private prerendererLogFile = '';

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
   * Blacklisted paths (do not prerender matching patterns).
   */
  private blacklistedPaths: string[] = [];

  /**
   * Whitelisted paths (do prerender matching patterns).
   */
  private whitelistedPaths: string[] = [];

  /**
   * Values as in process.env.
   */
  private processEnv: PrerendererConfigParams;

  /**
   * Whether config has been initialized.
   */
  private initialized = false;

  constructor(config: PrerendererConfigParams) {
    dotenv.config();

    this.processEnv = {
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
        !this.processEnv[env] ||
        (typeof this.processEnv[env] === 'string' && !(this.processEnv[env] as string).length)
      ) {
        throw new MissingEnvException(env);
      }
    });
  }

  /**
   * Initialize snapshots configuration.
   */
  private async initSnapshotConfig(): Promise<void> {
    const snapshotsDriver: SnapshotsDriver = this.processEnv.snapshotsDriver as SnapshotsDriver;
    let snapshotsDirectory: string = this.processEnv.snapshotsDirectory;

    const correctDrivers = ['fs', 's3'];

    if (!correctDrivers.includes(snapshotsDriver)) {
      throw new MismatchingEnvException(
        'snapshotsDriver',
        this.processEnv.nodeEnv as string,
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
    if (!this.processEnv.prerendererLogFile) {
      return;
    }

    /**
     * Make the directory absolute.
     */
    const logFile = this.processEnv.prerendererLogFile.startsWith('/')
      ? this.processEnv.prerendererLogFile
      : join(process.cwd(), this.processEnv.prerendererLogFile);

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
    this.nodeEnvironment = this.processEnv.nodeEnv;
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
   * Get blacklisted paths.
   */
  public getBlacklistedPaths(): string[] {
    return this.blacklistedPaths;
  }

  /**
   * Get whitelisted paths.
   */
  public getWhitelistedPaths(): string[] {
    return this.whitelistedPaths;
  }

  /**
   * TODO: document me.
   */
  public static getTimeout(): number {
    return 10000;
  }

  /**
   * TODO: document me.
   */
  public static getBlacklistedRequestURLRegExps(): RegExp[] {
    return [/www\.google-analytics\.com/, /\/gtag\/js/, /ga\.js/, /analytics\.js/];
  }

  // TODO: compare this list and extensions list with the one in
  // https://gist.github.com/thoop/8072354
  public static getBotUserAgents(): string[] {
    return [
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
  }

  /**
   * TODO: document me.
   */
  public static getIgnoredExtensions(): string[] {
    return [
      '.js',
      '.css',
      '.xml',
      '.less',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.pdf',
      '.doc',
      '.txt',
      '.ico',
      '.rss',
      '.zip',
      '.mp3',
      '.rar',
      '.exe',
      '.wmv',
      '.doc',
      '.avi',
      '.ppt',
      '.mpg',
      '.mpeg',
      '.tif',
      '.wav',
      '.mov',
      '.psd',
      '.ai',
      '.xls',
      '.mp4',
      '.m4a',
      '.swf',
      '.dat',
      '.dmg',
      '.iso',
      '.flv',
      '.m4v',
      '.torrent',
      '.woff',
      '.ttf',
      '.svg',
      '.webmanifest',
    ];
  }
}
