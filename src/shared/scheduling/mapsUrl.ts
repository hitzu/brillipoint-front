/**
 * Validates an optional Google Maps (or any http/https) URL field. An empty
 * value is valid — the field itself is optional, only its format is
 * checked when something was typed.
 */
export function validMapsUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return (
      Boolean(url.hostname) &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}
