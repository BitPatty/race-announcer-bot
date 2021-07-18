import { JoinColumn } from 'typeorm';
import TransformerUtils from '../../utils/transformer.utils';

/* eslint-disable @typescript-eslint/ban-types */

const EntityJoinColumn = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = TransformerUtils.toAttributeName(propertyKey as string);

    JoinColumn({
      name: columnName,
    })(target, propertyKey);
  };
};

export { EntityJoinColumn };
