import { Prerenderer } from './prerenderer';
import { Config } from './config';
import { Logger } from './logger';
import { Database } from './database';
import { PrerendererConfig } from './config/defaults';

export class PrerendererService {
  /**
   * Prerenderer service's Puppeteer wrapper singleton.
   */
  private prerenderer: Prerenderer;

  /**
   * Prerenderer service's database singleton.
   */
  private database: Database;

  /**
   * Prerenderer service's configuration singleton.
   */
  private config: Config;

  /**
   * Prerenderer service's logger singleton.
   */
  private logger: Logger;

  constructor(config: PrerendererConfig) {
    this.config = new Config(config);
    this.logger = new Logger(this.config);
    this.database = new Database(this.config, this.logger);
    this.prerenderer = new Prerenderer(this.config, this.logger);
  }

  /**
   * Start prerenderer services.
   */
  public async start(): Promise<void> {
    await this.logger.start();
    await this.database.connect();
    await this.prerenderer.start();
  }

  /**
   * Stop prerenderer services.
   */
  public async stop(): Promise<void> {
    await this.prerenderer.stop();
    await this.database.disconnect();
    await this.logger.stop();
  }

  /**
   * Getter for prerenderer singleton.
   */
  public getPrerenderer(): Prerenderer {
    return this.prerenderer;
  }

  /**
   * Getter for database singleton.
   */
  public getDatabase(): Database {
    return this.database;
  }

  /**
   * Getter for config singleton.
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Getter for logger singleton.
   */
  public getLogger(): Logger {
    return this.logger;
  }
}
