import { Entity, ManyToOne } from 'typeorm';
import { EntityColumn, EntityJoinColumn } from '../decorators';
import { EntrantStatus } from '../enums';
import { keys } from 'ts-transformer-keys';
import BaseEntity, { EntityInitializer } from './base.entity';
import RaceEntity from './race.entity';
import RacerEntity from './racer.entity';
import TransformerUtils from '../../utils/transformer.utils';

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
