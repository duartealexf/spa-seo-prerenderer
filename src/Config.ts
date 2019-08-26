import dotenv from 'dotenv';
import { join } from 'path';

import { MissingEnvException } from './Exceptions/MissingEnvException';
import { InvalidEnvException } from './Exceptions/InvalidEnvException';

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

    const SNAPSHOTS_DRIVER: 'fs' | 's3' = process.env.SNAPSHOTS_DRIVER as
      | 'fs'
      | 's3';
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
}

module.exports = {
  Config: new Config(),
};
