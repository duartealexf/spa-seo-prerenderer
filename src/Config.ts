import dotenv from 'dotenv';
import { join } from 'path';

import { MissingEnvException } from './Exceptions/MissingEnvException';
import { InvalidEnvException } from './Exceptions/InvalidEnvException';

export type SnapshotsDriver = 'fs' | 's3';

class Config {
  private snapshotsDriver: string;
  private snapshotsDirectory: string;

  constructor() {
    dotenv.config();

    ['SNAPSHOTS_DRIVER', 'SNAPSHOTS_DIRECTORY'].forEach((env) => {
      if (!process.env[env] || !process.env[env].length) {
        throw new MissingEnvException(env);
      }
    });

    const SNAPSHOTS_DRIVER: SnapshotsDriver = process.env
      .SNAPSHOTS_DRIVER as SnapshotsDriver;
    let SNAPSHOTS_DIRECTORY: string = process.env.SNAPSHOTS_DIRECTORY;

    if (!['fs', 's3'].includes(SNAPSHOTS_DRIVER)) {
      throw new InvalidEnvException(`
        SNAPSHOTS_DRIVER must be either 'fs' or 's3'. It is currently set as '${SNAPSHOTS_DRIVER}', which is not correct.
      `);
    }

    if (SNAPSHOTS_DRIVER === 's3') {
      if (/^\.|^\//.test(SNAPSHOTS_DIRECTORY)) {
        throw new InvalidEnvException(`
          SNAPSHOTS_DIRECTORY cannot start with '.' or '/' when SNAPSHOTS_DRIVER is 's3'. Adjust it to choose to a valid relative directory in S3.
      `);
      }
    } else {
      SNAPSHOTS_DIRECTORY = SNAPSHOTS_DIRECTORY.startsWith('/')
        ? SNAPSHOTS_DIRECTORY
        : join(process.cwd(), SNAPSHOTS_DIRECTORY);
    }

    this.snapshotsDriver = SNAPSHOTS_DRIVER;
    this.snapshotsDirectory = SNAPSHOTS_DIRECTORY;
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

  public getTimeout() {
    return 10000;
  }

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

const singleton = new Config();
export { singleton as Config };
