import { JoinColumn } from 'typeorm';
import TransformerUtils from '../../utils/transformer.utils';

// Allow the type 'Object' to be used
/* eslint-disable @typescript-eslint/ban-types */

/**
 * Decorator override for the typeorm {@link JoinColumn} decorator
 * used to simplify the declaration process
 */
const EntityJoinColumn = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = TransformerUtils.toAttributeName(propertyKey as string);

    JoinColumn({
      name: columnName,
    })(target, propertyKey);
  };
};

export { EntityJoinColumn };
