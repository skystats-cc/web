import type { HypixelStatus } from '@skystats/api-client';
import { skyblockComponent, toneFor, type Tone } from '../lib/status';

// The site-wide "is SkyBlock down?" bar
export function StatusBar({ status, error }: { status: HypixelStatus | null; error: Error | null }) {
  let tone: Tone = 'unknown';
  let text = 'Checking Hypixel status…';

  if (error) {
    text = "Can't reach the SkyStats API right now";
  } else if (status) {
    const sb = skyblockComponent(status);
    if (sb && sb.status !== 'operational') {
      tone = 'bad';
      text = `SkyBlock is having issues: ${sb.status.replace(/_/g, ' ')}`;
    } else if (status.indicator === 'unknown') {
      text = 'Hypixel status not available yet';
    } else {
      tone = toneFor(status.indicator);
      text = tone === 'good' ? 'SkyBlock is up' : status.description;
    }
  }

  return (
    <div className={`statusbar tone-${tone}`} role="status">
      <span className="dot" aria-hidden />
      {text}
      <a href="https://status.hypixel.net" target="_blank" rel="noreferrer">
        Details
      </a>
    </div>
  );
}
