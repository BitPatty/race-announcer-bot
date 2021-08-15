/**
 * Helper class for entity transformers
 *
 * Used to ensure a consistent naming scheme in the
 * database
 */
class TransformerUtils {
  /**
   * Converts a camelCase string to its snake_case representation
   * @param str The string to convert
   * @returns The snake_case representation of the camelCase value
   */
  private static camelCaseToSnakeCase(str: string): string {
    return str
      .replace(/([A-Z]+)/g, '_$1')
      .toLowerCase()
      .replace(/^_+/, '');
  }

  /**
   * Transforms the property to its attribute representation
   * in the database
   * @param propName The name of the property
   * @returns The attribute name
   */
  public static toAttributeName(propName: string): string {
    return this.camelCaseToSnakeCase(propName);
  }

  /**
   * Transforms the class name to its entity representation
   * in the database
   * @param className The name of the class
   * @returns The entity name
   */
  public static toTableName<T>(className: new () => T): string {
    return this.camelCaseToSnakeCase(className.name).replace(/_entity$/, '');
  }
}

export default TransformerUtils;
