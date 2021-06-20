import {
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityColumn } from './entity-column.decorator';
import Transformers from '../../utils/transformers';

/* eslint-disable @typescript-eslint/ban-types */

enum GeneratedColumnType {
  PRIMARY = 'primary',
  UUID = 'uuid',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  DELETED_AT = 'deleted_at',
}

const GeneratedColumn = (type: GeneratedColumnType): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = Transformers.toAttributeName(propertyKey as string);

    switch (type) {
      case GeneratedColumnType.PRIMARY:
        PrimaryGeneratedColumn({ name: columnName })(target, propertyKey);
        break;
      case GeneratedColumnType.UUID:
        Generated('uuid')(target, propertyKey);
        EntityColumn({ unique: true })(target, propertyKey);
        break;
      case GeneratedColumnType.CREATED_AT:
        CreateDateColumn({ name: columnName, nullable: false })(
          target,
          propertyKey,
        );
        break;
      case GeneratedColumnType.UPDATED_AT:
        UpdateDateColumn({ name: columnName, nullable: false })(
          target,
          propertyKey,
        );
        break;
      case GeneratedColumnType.DELETED_AT:
        DeleteDateColumn({ name: columnName, nullable: true })(
          target,
          propertyKey,
        );
        break;
    }
  };
};

export { GeneratedColumn, GeneratedColumnType };
