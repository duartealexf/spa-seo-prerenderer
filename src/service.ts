import { IncomingMessage } from 'http';

import { Prerenderer } from './prerenderer';
import { Config } from './config';
import { Logger } from './logger';
import { Database } from './database';
import { PrerendererConfig } from './config/defaults';
import { Snapshot } from './snapshot';
import { parseRequestURL } from './request';

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
   * Whether prerenderer service should handle request.
   * @param request
   */
  public shouldHandleRequest(request: IncomingMessage): boolean {
    return this.prerenderer.shouldPrerender(request);
  }

  /**
   * Let prerenderer service handle this request, by retrieving,
   * or creating a snapshot, and returning it.
   * @param request
   */
  public async handleRequest(request: IncomingMessage): Promise<Snapshot> {
    const url = parseRequestURL(request);

    this.config.getIgnoredQueryParameters().forEach((p) => url.searchParams.delete(p));
    url.searchParams.sort();

    let snapshot = await Snapshot.findByUrl(url.toString());

    if (!snapshot || snapshot.needsRefresh(this.config.getCacheMaxAge())) {
      snapshot = await this.prerenderer.prerenderAndGetSnapshot(url.toString());
    }

    return snapshot;
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
