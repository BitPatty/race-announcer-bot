import { Column } from 'typeorm';
import { DatabaseAttributeType } from '../enums';
import Transformers from '../../utils/transformers';

/* eslint-disable @typescript-eslint/ban-types */

type EntityColumnProps = {
  nullable?: boolean;
  enum?: (string | number)[] | Object;
  type?: DatabaseAttributeType;
  unique?: boolean;
  default?: boolean;
};

const EntityColumn = (columnProps?: EntityColumnProps): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = Transformers.toAttributeName(propertyKey as string);

    Column({
      ...(columnProps ?? {}),
      type:
        columnProps?.type ??
        (columnProps?.enum ? DatabaseAttributeType.ENUM : undefined),
      name: columnName,
    })(target, propertyKey);
  };
};

export { EntityColumn };
