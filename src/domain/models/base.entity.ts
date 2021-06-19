import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DatabaseAttributeType } from '../enums';
import Transformers from '../../utils/transformers';

type EntityInitializer<T extends BaseEntity<T>> = Omit<T, keyof BaseEntity<T>>;

abstract class BaseEntity<T extends BaseEntity<T>> {
  @PrimaryGeneratedColumn({
    name: Transformers.toAttributeName(nameof<BaseEntity<T>>((e) => e.id)),
  })
  id: number;

  @Generated('uuid')
  @Column({
    name: Transformers.toAttributeName(nameof<BaseEntity<T>>((e) => e.uuid)),
    unique: true,
  })
  public uuid: string;

  @CreateDateColumn({
    name: Transformers.toAttributeName(
      nameof<BaseEntity<T>>((e) => e.createdAt),
    ),
    type: DatabaseAttributeType.DATETIME,
    nullable: false,
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: Transformers.toAttributeName(
      nameof<BaseEntity<T>>((e) => e.updatedAt),
    ),
    type: DatabaseAttributeType.DATETIME,
    nullable: false,
  })
  public updatedAt: Date;

  @DeleteDateColumn({
    // name: Transformers.toAttributeName(
    //   nameof<BaseEntity<T>>((e) => e.deletedAt),
    // ),
    type: DatabaseAttributeType.DATETIME,
    nullable: true,
  })
  public deletedAt: Date;
}

export default BaseEntity;
export { EntityInitializer };
