class Transformers {
  private static replaceUppercaseWithUnderscorePrefix(str: string): string {
    return str
      .replace(/([A-Z]+)/g, '_$1')
      .toLowerCase()
      .replace(/^_+/, '');
  }

  public static toAttributeName(propName: string): string {
    return this.replaceUppercaseWithUnderscorePrefix(propName);
  }

  public static toTableName<T>(className: new () => T): string {
    return this.replaceUppercaseWithUnderscorePrefix(className.name).replace(
      /_entity$/,
      '',
    );
  }
}

export default Transformers;
