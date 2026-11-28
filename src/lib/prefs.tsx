import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setNumberStyle } from './format';
import { readPref, writePref } from './storage';

export const THEMES = ['system', 'dark', 'light', 'oled'] as const;
export const PALETTES = ['default', 'colourblind'] as const;
export const NUMBER_STYLES = ['compact', 'full'] as const;
export type Theme = (typeof THEMES)[number];
export type Palette = (typeof PALETTES)[number];
export type NumberStyle = (typeof NUMBER_STYLES)[number];

interface Prefs {
  theme: Theme;
  palette: Palette;
  numbers: NumberStyle;
  set: (p: Partial<Omit<Prefs, 'set'>>) => void;
}
const Ctx = createContext<Prefs | null>(null);

/** Display preferences: theme, colour-blind-safe palette, number style. Stored on this device only. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readPref('theme', THEMES, 'system'));
  const [palette, setPalette] = useState<Palette>(() => readPref('palette', PALETTES, 'default'));
  const [numbers, setNumbers] = useState<NumberStyle>(() => readPref('numbers', NUMBER_STYLES, 'compact'));

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    const apply = () => (root.dataset.theme = theme === 'system' ? (media?.matches ? 'light' : 'dark') : theme);
    apply();
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);
  setNumberStyle(numbers);

  const value = useMemo<Prefs>(
    () => ({
      theme,
      palette,
      numbers,
      set: (p) => {
        if (p.theme) (setTheme(p.theme), writePref('theme', p.theme));
        if (p.palette) (setPalette(p.palette), writePref('palette', p.palette));
        if (p.numbers) (setNumbers(p.numbers), writePref('numbers', p.numbers));
      },
    }),
    [theme, palette, numbers],
  );
  // Remount on number-style change so every formatted value updates at once
  return <Ctx.Provider value={value}><div key={numbers} style={{ display: 'contents' }}>{children}</div></Ctx.Provider>;
}

export function usePrefs() {
  const p = useContext(Ctx);
  if (!p) throw new Error('usePrefs outside PrefsProvider');
  return p;
}
