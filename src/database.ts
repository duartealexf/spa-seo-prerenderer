import { createConnection, Connection, ConnectionOptions, getConnectionManager } from 'typeorm';

import { Config } from './config';
import { Logger } from './logger';

export class Database {
  /**
   * Database connection.
   */
  private connection?: Connection;

  /**
   * Prerenderer service configuration singleton.
   */
  private config: Config;

  /**
   * Prerenderer service logger singleton.
   */
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Start database connection.
   */
  public async connect(): Promise<void> {
    const connectionOptions: ConnectionOptions = {
      ...this.config.getDatabaseOptions(),
      type: 'mongodb',
      name: 'default',
    };

    if (this.connection && this.connection.isConnected) {
      return;
    }

    if (getConnectionManager().has('default')) {
      return;
    }

    this.logger.info('Starting MongoDB connection...', 'database');
    this.connection = await createConnection(connectionOptions);
    this.logger.info('Started MongoDB connection.', 'database');
  }

  /**
   * Stop database connection.
   */
  public async disconnect(): Promise<void> {
    if (this.connection) {
      this.logger.info('Stopping MongoDB connection...', 'database');
      await this.connection.close();
      this.logger.info('Stopped MongoDB connection.', 'database');
    }
  }
}
