/**
 * Checks if the specified enum contains the specified value
 * @param enumeration The enum
 * @param value The value
 * @param ignoreCasing Whether perform a case insensitive search
 * @returns True if the enum contains the specified value
 */
const enumContainsValue = <T extends string, TEnumValue extends string>(
  enumeration: { [key in T]: TEnumValue },
  value: TEnumValue,
  ignoreCasing = true,
): boolean => {
  const enumValues = Object.values(enumeration) as TEnumValue[];
  return ignoreCasing
    ? enumValues.map((e) => e.toLowerCase()).includes(value.toLowerCase())
    : enumValues.includes(value);
};

/**
 * Gets the values contained within the specified enum
 * @param enumeration The enum
 * @returns The values within the enum
 */
const getEnumValues = <T extends string, TEnumValue extends string>(
  enumeration: { [key in T]: TEnumValue },
): TEnumValue[] => {
  return Object.values(enumeration);
};

/**
 * Finds the enum value for the specified string
 * (CASE INSENSITIVE)
 * @param enumeration The enum
 * @param value The value
 * @returns The enum value or NULL if the string
 * is not contained in the enum
 */
const parseEnumValue = <T extends string, TEnumValue extends string>(
  enumeration: { [key in T]: TEnumValue },
  value: TEnumValue,
): TEnumValue | null => {
  const enumValues = Object.values(enumeration) as TEnumValue[];
  return (
    enumValues.find((e) => e.toLowerCase() === value.toLowerCase()) ?? null
  );
};

export { enumContainsValue, getEnumValues, parseEnumValue };
