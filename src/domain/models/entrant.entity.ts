import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseAttributeType, EntrantStatus } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import RacerEntity from './racer.entity';
import Transformers from '../../utils/transformers';

@Entity(Transformers.toTableName(EntrantEntity))
class EntrantEntity extends BaseEntity<EntrantEntity> {
  public constructor(d?: EntityInitializer<EntrantEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<EntrantEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @Column({
    name: Transformers.toAttributeName(nameof<EntrantEntity>((e) => e.status)),
    nullable: false,
    type: DatabaseAttributeType.ENUM,
    enum: EntrantStatus,
  })
  public status: EntrantStatus;

  @ManyToOne(() => RacerEntity, {
    nullable: false,
  })
  @JoinColumn({
    name: Transformers.toAttributeName(nameof<EntrantEntity>((e) => e.racer)),
  })
  public racer: RacerEntity;

  @ManyToOne(() => RaceEntity, {
    nullable: false,
  })
  @JoinColumn({
    name: Transformers.toAttributeName(nameof<EntrantEntity>((e) => e.race)),
  })
  public race: RaceEntity;
}

export default EntrantEntity;
