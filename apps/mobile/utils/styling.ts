export function cleanObject<T extends object>(value: T | undefined | null): T | undefined | null {
  if (!value) {
    return value;
  }

  const result = { ...value };
  for (const key in result) {
    if (result[key] === null || result[key] === undefined) {
      delete (result as Record<string, unknown>)[key];
    }
  }
  return result;
}
