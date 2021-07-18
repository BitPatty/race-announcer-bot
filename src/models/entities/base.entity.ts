import { GeneratedColumn, GeneratedColumnType } from '../decorators';

type EntityInitializer<T extends BaseEntity<T>> = Omit<T, keyof BaseEntity<T>>;

abstract class BaseEntity<T extends BaseEntity<T>> {
  @GeneratedColumn(GeneratedColumnType.PRIMARY)
  public id: number;

  @GeneratedColumn(GeneratedColumnType.UUID)
  public uuid: string;

  @GeneratedColumn(GeneratedColumnType.CREATED_AT)
  public createdAt: Date;

  @GeneratedColumn(GeneratedColumnType.UPDATED_AT)
  public updatedAt: Date;

  @GeneratedColumn(GeneratedColumnType.DELETED_AT)
  public deletedAt: Date;
}

export default BaseEntity;
export { EntityInitializer };
