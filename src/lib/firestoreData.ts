function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeFirestoreValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.reduce<unknown[]>((result, entry) => {
      const sanitizedEntry = sanitizeFirestoreValue(entry);
      if (sanitizedEntry !== undefined) {
        result.push(sanitizedEntry);
      }
      return result;
    }, []);
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce<Record<string, unknown>>((result, [key, entry]) => {
      const sanitizedEntry = sanitizeFirestoreValue(entry);
      if (sanitizedEntry !== undefined) {
        result[key] = sanitizedEntry;
      }
      return result;
    }, {});
  }

  return value;
}

export function sanitizeFirestoreData<T>(value: T): T {
  return sanitizeFirestoreValue(value) as T;
}
