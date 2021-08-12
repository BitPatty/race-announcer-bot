import { GeneratedColumn, GeneratedColumnType } from '../decorators';

type EntityInitializer<T extends BaseEntity<T>> = Omit<T, keyof BaseEntity<T>>;

abstract class BaseEntity<T extends BaseEntity<T>> {
  /**
   * Unique identifier of this entity in the entity set
   */
  @GeneratedColumn(GeneratedColumnType.PRIMARY)
  public id: number;

  /**
   * Unique identifier of this entity across the application
   */
  @GeneratedColumn(GeneratedColumnType.UUID)
  public uuid: string;

  /**
   * The timestamp of when this entity was recorded
   */
  @GeneratedColumn(GeneratedColumnType.CREATED_AT)
  public createdAt: Date;

  /**
   * The timestamp of when this entity last changed
   */
  @GeneratedColumn(GeneratedColumnType.UPDATED_AT)
  public updatedAt: Date;

  /**
   * The timestamp of when this entity has been soft deleted
   */
  @GeneratedColumn(GeneratedColumnType.DELETED_AT)
  public deletedAt: Date;
}

export default BaseEntity;
export { EntityInitializer };
