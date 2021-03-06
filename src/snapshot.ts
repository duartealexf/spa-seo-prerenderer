/* eslint-disable no-underscore-dangle */
import 'reflect-metadata';

import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  SaveOptions,
} from 'typeorm';

@Entity('snapshots')
export class Snapshot extends BaseEntity {
  @ObjectIdColumn()
  private _id?: ObjectID;

  /**
   * Rendered HTML.
   */
  @Column()
  private url: string;

  /**
   * Rendered HTML.
   */
  @Column()
  private body: string;

  /**
   * Status code of response.
   */
  @Column()
  private status: number;

  /**
   * Snapshot url tags.
   */
  @Column()
  private tags: string[];

  /**
   * How long it took to generate snapshot, in ms.
   */
  @Column()
  private responseTime: number;

  /**
   * Last update timestamp.
   */
  @UpdateDateColumn()
  private updatedAt?: Date;

  /**
   * Whether snapshot has data changed.
   */
  private isDirty = false;

  constructor(
    url: string,
    body: string,
    status: number,
    responseTime: number,
    tags: string[] = [],
  ) {
    super();

    this.url = url;
    this.body = body;
    this.status = status;
    this.responseTime = responseTime;
    this.tags = tags;
  }

  /**
   * Find the stored snapshot with given url.
   */
  static findByUrl(url: string): Promise<Snapshot | undefined> {
    return this.findOne({
      where: { url },
    });
  }

  /**
   * Get whether model instance can be saved to database.
   */
  private canBeSaved(): boolean {
    if (typeof this.body !== 'string' || typeof this.status !== 'number') {
      return false;
    }

    return this.body.length > 0 && this.status < 500 && (!this.hasId() || this.isDirty);
  }

  /**
   * Save snapshot only if has been refreshed and has a body.
   * @param options
   */
  public async saveIfNeeded(options?: SaveOptions): Promise<this> {
    if (this.canBeSaved()) {
      await super.save(options);
      return this;
    }
    return this;
  }

  /**
   * Whether snapshot is old and should be refreshed, according to given age.
   */
  public isOld(ageInDays: number): boolean {
    return this.updatedAt
      ? this.updatedAt.valueOf() + ageInDays * 86400000 <= Date.now().valueOf()
      : false;
  }

  /**
   * Absorb body, status and responseTime from another snapshot into this one.
   * @param anotherSnapshot
   */
  public absorb(anotherSnapshot: Snapshot): void {
    this.body = anotherSnapshot.body;
    this.status = anotherSnapshot.status;
    this.responseTime = anotherSnapshot.responseTime;
    this.isDirty = true;
  }

  /**
   * Entity _id getter.
   */
  public getId(): ObjectID | undefined {
    return this._id;
  }

  /**
   * Get HTTP status code for response.
   */
  public getStatusForResponse(): number {
    return this.status;
  }

  /**
   * Get headers to be attached to response.
   */
  public getHeadersForResponse(): { [header: string]: string } {
    return {
      'X-Response-Time': this.responseTime.toString(),
      'X-Original-Location': this.url,
    };
  }

  /**
   * Get response body.
   */
  public getBodyForResponse(): string {
    return this.body;
  }

  /**
   * Get last updated date of snapshot.
   */
  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  /**
   * Get snapshot tags.
   */
  public getTags(): string[] {
    return this.tags;
  }

  /**
   * Set snapshot tags.
   * @param tags
   */
  public setTags(tags: string[]): void {
    this.tags = tags;
    this.isDirty = true;
  }
}
