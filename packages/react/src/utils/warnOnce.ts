const seen = new Set<string>();

export function warnOnce(key: string, message: string) {
  if (process?.env.NODE_ENV === 'production') return;
  if (seen.has(key)) return;
  // eslint-disable-next-line no-console
  console.warn(message);
  seen.add(key);
}