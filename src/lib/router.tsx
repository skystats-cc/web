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
