import { NUMBER_STYLES, PALETTES, THEMES, usePrefs, type NumberStyle, type Palette, type Theme } from '../lib/prefs';

const THEME_LABEL: Record<Theme, string> = { system: 'Match my device', dark: 'Dark', light: 'Light', oled: 'Black (OLED)' };
const PALETTE_LABEL: Record<Palette, string> = { default: 'Standard', colourblind: 'Colour-blind safe' };
const NUMBER_LABEL: Record<NumberStyle, string> = { compact: '1.23M', full: '1,234,567' };

/** Display choices, saved on this device only (works signed out too) */
export function DisplaySection() {
  const p = usePrefs();
  return (
    <section className="card" style={{ marginTop: 20 }}>
      <h2>Display</h2>
      <p className="muted small">Saved in this browser only.</p>
      <div className="form-grid">
        <label>
          Theme
          <select value={p.theme} onChange={(e) => p.set({ theme: e.target.value as Theme })}>
            {THEMES.map((t) => <option key={t} value={t}>{THEME_LABEL[t]}</option>)}
          </select>
        </label>
        <label>
          Chart colours
          <select value={p.palette} onChange={(e) => p.set({ palette: e.target.value as Palette })}>
            {PALETTES.map((t) => <option key={t} value={t}>{PALETTE_LABEL[t]}</option>)}
          </select>
        </label>
        <label>
          Numbers
          <select value={p.numbers} onChange={(e) => p.set({ numbers: e.target.value as NumberStyle })}>
            {NUMBER_STYLES.map((t) => <option key={t} value={t}>{NUMBER_LABEL[t]}</option>)}
          </select>
        </label>
      </div>
      <p className="muted small">Press <kbd>?</kbd> anywhere for keyboard shortcuts, or <kbd>Ctrl K</kbd> to jump to a page.</p>
    </section>
  );
}
