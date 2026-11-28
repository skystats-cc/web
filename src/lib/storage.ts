// Small wrappers: localStorage can be missing, full or blocked (private mode, embedded views).
// Only preferences the visitor sets themselves go here, so no cookie banner is needed (PECR:
// storage the user asked for is strictly necessary).
export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = window.localStorage.getItem(`ss:${key}`);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(`ss:${key}`, value);
  } catch {
    /* not available; the choice lasts for this visit */
  }
}
