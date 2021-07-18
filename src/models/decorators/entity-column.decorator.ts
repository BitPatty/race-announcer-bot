import { Column } from 'typeorm';
import { DatabaseAttributeType } from '../enums';
import TransformerUtils from '../../utils/transformer.utils';

/* eslint-disable @typescript-eslint/ban-types */

type EntityColumnProps = {
  nullable?: boolean;
  enum?: (string | number)[] | Object;
  type?: DatabaseAttributeType;
  unique?: boolean;
  default?: boolean | number;
  length?: number;
};

const EntityColumn = (columnProps?: EntityColumnProps): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = TransformerUtils.toAttributeName(propertyKey as string);

    Column({
      ...(columnProps ?? {}),
      type:
        columnProps?.type ??
        (columnProps?.enum ? DatabaseAttributeType.ENUM : undefined),
      name: columnName,
      length: columnProps?.length,
    })(target, propertyKey);
  };
};

export { EntityColumn };
