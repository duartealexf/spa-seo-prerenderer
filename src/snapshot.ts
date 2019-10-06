import 'reflect-metadata';

import { Entity, ObjectID, ObjectIdColumn, Column, BaseEntity, UpdateDateColumn } from 'typeorm';

export type PrerendererHeaders = {
  /**
   * Duration of prerendering, from request to prerendered body.
   */
  'X-Prerendered-Ms': string;
  'X-Original-Location': string;
  [header: string]: string | string[] | undefined;
};

@Entity('snapshots')
export class Snapshot extends BaseEntity {
  @ObjectIdColumn()
  _id!: ObjectID;

  /**
   * Rendered HTML.
   */
  @Column()
  url!: string;

  /**
   * Rendered HTML.
   */
  @Column()
  body!: string;

  /**
   * Status code of response.
   */
  @Column()
  status!: number;

  /**
   * Headers from Prerenderer response.
   */
  @Column()
  headers!: PrerendererHeaders;

  /**
   * Snapshot url tags.
   */
  @Column()
  tags!: string[];

  /**
   * Last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  // constructor() {
  //   super();
  //   Snapshot.useConnection(getManager('default').connection);
  // }

  /**
   * Find the stored snapshot with given url.
   */
  static findByUrl(url: string): Promise<Snapshot | undefined> {
    return this.findOne({ url });
  }

  /**
   * Whether snapshot should be refreshed
   */
  // public shouldRefresh() {

  // }
}
