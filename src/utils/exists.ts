export function exists<T>(t: T | null | undefined): t is T {
  return t !== null && t !== undefined;
}
