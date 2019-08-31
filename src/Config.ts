import dotenv from 'dotenv';
import { join } from 'path';

import { MissingEnvException } from './Exceptions/MissingEnvException';
import { InvalidEnvException } from './Exceptions/InvalidEnvException';
import { MismatchingEnvException } from './Exceptions/MismatchingEnvException';
import { Filesystem } from './Filesystem/Filesystem';

/**
 * Possible values for SNAPSHOTS_DRIVER environment config.
 */
export type SnapshotsDriver = 'fs' | 's3';

/**
 * Possible values for SNAPSHOTS_DIRECTORY environment config.
 */
export type NodeEnvironment = 'development' | 'production';

/**
 * Interface for needed values as in process.env.
 */
export interface PrerendererConfigParams {
  [key: string]: string;
  /**
   * Prerenderer log file location.
   */
  PRERENDERER_LOG_FILE: string;

  /**
   * Node environment.
   */
  NODE_ENV: NodeEnvironment;

  /**
   * Chosen snapshots driver.
   */
  SNAPSHOTS_DRIVER: SnapshotsDriver;

  /**
   * Directory to store snapshots in.
   */
  SNAPSHOTS_DIRECTORY: string;
}

export class Config {
  /**
   * Prerenderer log file location.
   */
  private prerendererLogFile: string = '';

  /**
   * Node environment.
   */
  private nodeEnvironment: NodeEnvironment = 'production';

  /**
   * Chosen snapshots driver.
   */
  private snapshotsDriver: SnapshotsDriver = 'fs';

  /**
   * Directory to store snapshots in.
   */
  private snapshotsDirectory: string = '../snapshots';

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

    this.processEnv = Object.assign(
      {
        PRERENDERER_LOG_FILE: process.env.PRERENDERER_LOG_FILE || '',
        NODE_ENV: process.env.NODE_ENV || 'production',
        SNAPSHOTS_DRIVER: process.env.SNAPSHOTS_DRIVER || 'fs',
        SNAPSHOTS_DIRECTORY: process.env.SNAPSHOTS_DIRECTORY || '../snapshots',
      },
      config,
    );
  }

  /**
   * Initialize configuration, which is required before starting app.
   */
  public async initialize(): Promise<void> {
    await this.checkRequiredConfig();
    await this.initSnapshotConfig();
    await this.initLoggingConfig();
    await this.initEnvironmentConfig();

    this.initialized = true;
  }

  /**
   * Check that all required configuration is set.
   */
  private checkRequiredConfig(): void {
    ['NODE_ENV', 'SNAPSHOTS_DRIVER', 'SNAPSHOTS_DIRECTORY'].forEach((env) => {
      if (!this.processEnv[env] || !this.processEnv[env].length) {
        throw new MissingEnvException(env);
      }
    });
  }

  /**
   * Initialize snapshots configuration.
   */
  private async initSnapshotConfig(): Promise<void> {
    const snapshotsDriver: SnapshotsDriver = this.processEnv
      .SNAPSHOTS_DRIVER as SnapshotsDriver;
    let snapshotsDirectory: string = this.processEnv.SNAPSHOTS_DIRECTORY;

    const correctDrivers = ['fs', 's3'];

    if (!correctDrivers.includes(snapshotsDriver)) {
      throw new MismatchingEnvException(
        'SNAPSHOTS_DRIVER',
        this.processEnv.NODE_ENV,
        correctDrivers,
      );
    }

    if (snapshotsDriver === 's3') {
      if (/^\.|^\//.test(snapshotsDirectory)) {
        throw new InvalidEnvException(
          "SNAPSHOTS_DIRECTORY cannot start with '.' or '/' when SNAPSHOTS_DRIVER is 's3'. Adjust it to choose to a valid relative directory in S3.",
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

    /**
     * Ensure directory exists.
     */
    const filesystem = new Filesystem('fs');
    await filesystem.ensureDir(snapshotsDirectory);

    this.snapshotsDriver = snapshotsDriver;
    this.snapshotsDirectory = snapshotsDirectory;
  }

  /**
   * Initialize logging configuration.
   */
  private async initLoggingConfig(): Promise<void> {
    if (!this.processEnv.PRERENDERER_LOG_FILE) {
      return;
    }

    /**
     * Make the directory absolute.
     */
    const logFile = this.processEnv.PRERENDERER_LOG_FILE.startsWith('/')
      ? this.processEnv.PRERENDERER_LOG_FILE
      : join(process.cwd(), this.processEnv.PRERENDERER_LOG_FILE);

    /**
     * Ensure file is exists and is writeable.
     */
    const filesystem = new Filesystem('fs');
    await filesystem.ensureFile(logFile);

    this.prerendererLogFile = logFile;
  }

  /**
   * Initialize other environment configurations.
   */
  private initEnvironmentConfig(): void {
    const nodeEnv: NodeEnvironment = this.processEnv
      .NODE_ENV as NodeEnvironment;

    const correctEnvironments = ['production', 'development'];

    if (!correctEnvironments.includes(nodeEnv)) {
      throw new MismatchingEnvException(
        'NODE_ENV',
        this.processEnv.NODE_ENV,
        correctEnvironments,
      );
    }

    this.nodeEnvironment = nodeEnv;
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
   * TODO: document me.
   */
  public getTimeout() {
    return 10000;
  }

  /**
   * TODO: document me.
   */
  public getBlacklistedRequestURLRegExps(): RegExp[] {
    return [
      /www\.google-analytics\.com/,
      /\/gtag\/js/,
      /ga\.js/,
      /analytics\.js/,
    ];
  }

  // TODO: compare this list and extensions list with the one in
  // https://gist.github.com/thoop/8072354
  public getBotUserAgents() {
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
  public getIgnoredExtensions() {
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
