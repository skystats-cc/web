import type { BazaarProduct } from '@skystats/api-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { t, type MessageKey } from '../lib/i18n';
import { navigate } from '../lib/router';
import { useSession } from '../lib/session';

interface Entry {
  label: string;
  hint?: string;
  href: string;
}
const PAGES: { key: MessageKey; href: string; shortcut?: string; signedIn?: boolean }[] = [
  { key: 'nav.status', href: '/', shortcut: 'g h' },
  { key: 'nav.bazaar', href: '/bazaar', shortcut: 'g b' },
  { key: 'nav.methods', href: '/methods', shortcut: 'g m' },
  { key: 'nav.leaderboards', href: '/leaderboards', shortcut: 'g l' },
  { key: 'nav.profiles', href: '/me', shortcut: 'g p', signedIn: true },
  { key: 'nav.alerts', href: '/alerts', shortcut: 'g a', signedIn: true },
  { key: 'nav.settings', href: '/settings', shortcut: 'g s', signedIn: true },
  { key: 'nav.developers', href: '/developers', signedIn: true },
  { key: 'nav.plans', href: '/pricing' },
];
const GO: Record<string, string> = Object.fromEntries(PAGES.filter((p) => p.shortcut).map((p) => [p.shortcut!.slice(2), p.href]));

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Ctrl/Cmd+K palette, "/" to open it, "g x" to jump to a page and "?" for the list. */
export function CommandPalette() {
  const { account } = useSession();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<BazaarProduct[]>([]);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let pendingG = false;
    let gTimer: ReturnType<typeof setTimeout> | undefined;
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape') return (setOpen(false), setHelp(false));
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') return (e.preventDefault(), setOpen(true));
      if (e.key === '?') return setHelp((h) => !h);
      if (pendingG && GO[e.key]) {
        pendingG = false;
        navigate(GO[e.key]!);
        return;
      }
      if (e.key === 'g') {
        pendingG = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => (pendingG = false), 1200);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setSel(0);
    setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) return setProducts([]);
    const id = setTimeout(() => api.bazaar.list(q.trim()).then((r) => setProducts(r.products.slice(0, 8))).catch(() => setProducts([])), 150);
    return () => clearTimeout(id);
  }, [q, open]);

  const entries = useMemo<Entry[]>(() => {
    const needle = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => !p.signedIn || account)
      .map((p) => ({ label: t(p.key), hint: p.shortcut, href: p.href }))
      .filter((p) => !needle || p.label.toLowerCase().includes(needle));
    const items = products.map((p) => ({ label: p.name, hint: 'Bazaar', href: `/bazaar/${encodeURIComponent(p.id)}` }));
    const player = /^[A-Za-z0-9_]{3,16}$/.test(q.trim()) ? [{ label: `Player ${q.trim()}`, hint: 'Profile', href: `/p/${q.trim()}` }] : [];
    return [...pages, ...items, ...player];
  }, [q, products, account]);

  function go(e: Entry | undefined) {
    if (!e) return;
    setOpen(false);
    navigate(e.href);
  }

  return (
    <>
      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
            <input
              ref={input}
              value={q}
              placeholder={t('palette.placeholder')}
              aria-label={t('palette.placeholder')}
              onChange={(e) => (setQ(e.target.value), setSel(0))}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') (e.preventDefault(), setSel((s) => Math.min(s + 1, entries.length - 1)));
                if (e.key === 'ArrowUp') (e.preventDefault(), setSel((s) => Math.max(s - 1, 0)));
                if (e.key === 'Enter') go(entries[sel]);
              }}
            />
            <ul role="listbox">
              {entries.map((e, i) => (
                <li key={e.href} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => go(e)}>
                  <span>{e.label}</span>
                  {e.hint && <kbd>{e.hint}</kbd>}
                </li>
              ))}
              {entries.length === 0 && <li className="muted">Nothing found</li>}
            </ul>
          </div>
        </div>
      )}
      {help && (
        <div className="overlay" onMouseDown={() => setHelp(false)}>
          <div className="palette help" role="dialog" aria-modal="true" aria-label={t('shortcuts.title')} onMouseDown={(e) => e.stopPropagation()}>
            <h2>{t('shortcuts.title')}</h2>
            <ul className="list">
              <li><span>Open the palette</span><kbd>Ctrl K</kbd> <kbd>/</kbd></li>
              {PAGES.filter((p) => p.shortcut && (!p.signedIn || account)).map((p) => (
                <li key={p.href}><span>{t(p.key)}</span><kbd>{p.shortcut}</kbd></li>
              ))}
              <li><span>This list</span><kbd>?</kbd></li>
              <li><span>Close</span><kbd>Esc</kbd></li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
