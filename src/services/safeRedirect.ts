/**
 * Returns a same-origin path (pathname, search and hash) for a redirect target.
 * Returns an empty string when the value is missing or points to another origin.
 */
export function toSafeLocalPath(
  value: string | null | undefined,
  origin: string,
): string {
  if (!value) return "";

  try {
    const target = new URL(value, origin);
    if (target.origin !== origin) return "";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "";
  }
}
