export function readPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, obj);
}

export function writePath(obj: Record<string, unknown>, path: string, value: string): void {
  const segments = path.split(".");
  let current: unknown = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    if (current === null || typeof current !== "object") return;
    current = (current as Record<string, unknown>)[segments[i]];
  }
  if (current === null || typeof current !== "object") return;
  const container = current as Record<string, unknown>;
  const lastKey = segments[segments.length - 1];
  if (typeof container[lastKey] !== "string") return;
  container[lastKey] = value;
}
