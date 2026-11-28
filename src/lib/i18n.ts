// i18n scaffold. Everything is English (UK) for now; add a dictionary and pick it from
// navigator.language when a translation is ready. Missing keys fall back to English.
const enGB = {
  'nav.status': 'Status',
  'nav.bazaar': 'Bazaar',
  'nav.methods': 'Methods',
  'nav.leaderboards': 'Leaderboards',
  'nav.profiles': 'My profiles',
  'nav.alerts': 'Alerts',
  'nav.plans': 'Plans',
  'nav.settings': 'Settings',
  'nav.developers': 'Developers',
  'nav.news': 'News',
  'palette.placeholder': 'Go to a page or search the bazaar…',
  'palette.hint': 'Ctrl K',
  'shortcuts.title': 'Keyboard shortcuts',
  'common.loading': 'Loading…',
  'common.close': 'Close',
  'chart.export': 'Download chart',
} as const;
export type MessageKey = keyof typeof enGB;

const dictionaries: Record<string, Partial<Record<MessageKey, string>>> = { 'en-GB': enGB };
let current: Partial<Record<MessageKey, string>> = enGB;

export function setLocale(locale: string) {
  current = dictionaries[locale] ?? dictionaries[locale.split('-')[0] ?? ''] ?? enGB;
}

export function t(key: MessageKey, vars: Record<string, string | number> = {}) {
  const s = current[key] ?? enGB[key];
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
