import { JoinColumn } from 'typeorm';
import Transformers from '../../utils/transformers';

/* eslint-disable @typescript-eslint/ban-types */

const EntityJoinColumn = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol): void => {
    const columnName = Transformers.toAttributeName(propertyKey as string);

    JoinColumn({
      name: columnName,
    })(target, propertyKey);
  };
};

export { EntityJoinColumn };
