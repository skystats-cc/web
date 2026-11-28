import type { NewsItem } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { t } from '../lib/i18n';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** SkyBlock patch notes from the Hypixel forums, in a side drawer. Links open the forum post. */
export function NewsDrawer() {
  const [open, setOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  useEffect(() => {
    if (open && news === null) api.news().then((r) => setNews(r.news)).catch(() => setNews([]));
  }, [open, news]);
  return (
    <>
      <button className="ghost tiny" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t('nav.news')}
      </button>
      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <aside className="drawer" aria-label="SkyBlock news" onMouseDown={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h2>SkyBlock news</h2>
              <button className="ghost tiny" onClick={() => setOpen(false)}>{t('common.close')}</button>
            </div>
            {news === null ? (
              <p className="muted">{t('common.loading')}</p>
            ) : news.length === 0 ? (
              <p className="muted">No news yet.</p>
            ) : (
              <ul className="list">
                {news.slice(0, 20).map((n) => (
                  <li key={n.id}>
                    <a href={n.id} target="_blank" rel="noopener noreferrer">{n.title}</a>
                    {n.publishedAt && <span className="muted small right">{dateFmt.format(new Date(n.publishedAt))}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">From the Hypixel forums. SkyStats isn&rsquo;t affiliated with Hypixel.</p>
          </aside>
        </div>
      )}
    </>
  );
}
