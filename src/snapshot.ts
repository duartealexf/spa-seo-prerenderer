import 'reflect-metadata';

import { Entity, ObjectID, ObjectIdColumn, Column, BaseEntity, UpdateDateColumn } from 'typeorm';

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
   * Whether snapshot should be refreshed, according to given age.
   */
  public needsRefresh(ageInDays: number): boolean {
    return this.updatedAt
      ? this.updatedAt.valueOf() + ageInDays * 86400000 <= Date.now().valueOf()
      : false;
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
  }
}
