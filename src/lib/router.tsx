import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';

// Tiny client-side router: three pages don't need a library. Caddy serves index.html for every path.
const listeners = new Set<() => void>();

export function navigate(to: string) {
  if (to === window.location.pathname) return;
  window.history.pushState(null, '', to);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return path;
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
}

/** A value kept in the URL query (?range=30d) so a view can be bookmarked and shared */
export function useQueryParam<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (v: T) => void] {
  const path = usePath();
  const read = () => {
    const v = new URLSearchParams(window.location.search).get(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  };
  const [value, setValue] = useState<T>(read);
  useEffect(() => setValue(read()), [path]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (v: T) => {
    const q = new URLSearchParams(window.location.search);
    if (v === fallback) q.delete(key);
    else q.set(key, v);
    const qs = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    setValue(v);
  };
  return [value, set];
}
