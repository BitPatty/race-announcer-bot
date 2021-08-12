import { Column } from 'typeorm';
import { DatabaseAttributeType } from '../enums';
import TransformerUtils from '../../utils/transformer.utils';

// Allow the type 'Object' to be used
/* eslint-disable @typescript-eslint/ban-types */

type EntityColumnProps = {
  nullable?: boolean;
  enum?: (string | number)[] | Object;
  type?: DatabaseAttributeType;
  unique?: boolean;
  default?: boolean | number;
  length?: number;
};

/**
 * Decorator override for the typeorm {@link Column} decorator
 * used to simplify the declaration process
 * @param columnProps Overrides for the declaration ({@link EntityColumnProps})
 */
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
