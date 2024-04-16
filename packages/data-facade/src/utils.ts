function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildQueryKey(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (isPlainObject(value)) {
    return Object.entries(value).flat();
  }

  return [value];
}
