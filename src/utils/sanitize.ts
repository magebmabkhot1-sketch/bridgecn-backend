export function stripSensitive<T>(value: T): T {
  const seen = new WeakMap<object, any>();

  const walk = (input: any): any => {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return input;
    if (input instanceof Date) return input;
    if (Array.isArray(input)) return input.map(walk);
    if (seen.has(input)) return seen.get(input);

    const output: any = {};
    seen.set(input, output);

    for (const [key, val] of Object.entries(input)) {
      if (key === 'passwordHash') continue;
      output[key] = walk(val);
    }

    return output;
  };

  return walk(value);
}
