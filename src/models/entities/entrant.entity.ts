import { Entity, ManyToOne } from 'typeorm';
import { keys } from 'ts-transformer-keys';

import { DatabaseAttributeType, EntrantStatus } from '../enums';
import { EntityColumn, EntityJoinColumn } from '../decorators';
import TransformerUtils from '../../utils/transformer.utils';

import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import RacerEntity from './racer.entity';

@Entity(TransformerUtils.toTableName(EntrantEntity))
class EntrantEntity extends BaseEntity<EntrantEntity> {
  public constructor(d?: EntityInitializer<EntrantEntity>) {
    super();

    if (d == null) return;
    const entityKeys: string[] = keys<EntityInitializer<EntrantEntity>>();
    for (const key of entityKeys) this[key] = d[key];
  }

  @EntityColumn({
    nullable: false,
    enum: EntrantStatus,
  })
  public status: EntrantStatus;

  @EntityColumn({
    nullable: true,
    type: DatabaseAttributeType.INTEGER,
  })
  public finalTime: number | null;

  @ManyToOne(() => RacerEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public racer: RacerEntity;

  @ManyToOne(() => RaceEntity, {
    nullable: false,
  })
  @EntityJoinColumn()
  public race: RaceEntity;
}

export default EntrantEntity;
