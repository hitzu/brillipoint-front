// Per-viewer conveniences only (open section, print checklist). Storage can be
// blocked or empty, so every access is guarded and the page works without it.
const PREFIX = "bp-manual:";

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage blocked: the value simply isn't remembered.
  }
}
