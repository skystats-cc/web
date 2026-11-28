import { LEGAL } from '../../lib/legal';
import { Link } from '../../lib/router';

export function PrivacyNotice() {
  return (
    <main className="wrap narrow legal">
      <h1 className="page-title">Privacy notice</h1>
      <p className="muted">Last updated {LEGAL.lastUpdated}</p>

      <section className="card tldr">
        <h2>The short version</h2>
        <ul>
          <li>We keep your Minecraft name, your SkyBlock profiles and the coins the SkyStats mod sees while you play.</li>
          <li>Everything that shows your data to other people is off until you turn it on.</li>
          <li>We don&rsquo;t sell your data, show ads based on it, or use it to guess things about you.</li>
          <li>You can download everything or delete your account at any time in <Link href="/settings">Privacy and data</Link>.</li>
          <li>If you&rsquo;re under 18 and something here worries you, talk to a parent, carer or teacher, or email us.</li>
        </ul>
      </section>

      <h2>Who we are</h2>
      <p>
        SkyStats.cc is run by {LEGAL.controllerName}, the data controller. Contact: {LEGAL.contactEmail}, {LEGAL.postalAddress}.
        ICO registration: {LEGAL.icoRegistration}. SkyStats is not affiliated with Hypixel, Mojang or Microsoft.
      </p>

      <h2>What we collect, why, and our lawful basis</h2>
      <table>
        <thead>
          <tr><th>Data</th><th>Why</th><th>Lawful basis (UK GDPR)</th></tr>
        </thead>
        <tbody>
          <tr><td>Minecraft UUID and username, checked with Mojang when you link</td><td>To create your account and prove it&rsquo;s yours</td><td>Contract</td></tr>
          <tr><td>Coins, bank and SkyBlock XP sent by the SkyStats mod while tracking is on</td><td>To show your money history</td><td>Contract</td></tr>
          <tr><td>Your SkyBlock profiles and co-op members, looked up from the Hypixel API when you link or open your profiles</td><td>To group your co-op and show who is on SkyStats</td><td>Contract; legitimate interests for co-op members who aren&rsquo;t on SkyStats</td></tr>
          <tr><td>Play sessions (when the mod was running) and rare drops seen in your own chat</td><td>Session and drop history on your dashboard</td><td>Contract</td></tr>
          <tr><td>SkyBlock item ids and counts in your inventory, sent with each coin snapshot</td><td>To value your inventory. We keep only the total value, not the items</td><td>Contract</td></tr>
          <tr><td>Activity labels for your sessions (farming, mining and so on)</td><td>Only if you turn them on in Privacy settings</td><td>Consent (you can turn it off any time)</td></tr>
          <tr><td>Discord user id and username, if you connect Discord (never your email or servers)</td><td>Sign in with Discord, the bot, and opt-in Discord roles</td><td>Contract</td></tr>
          <tr><td>Alerts, goals, notes, watchlist, custom methods and method votes you create</td><td>To provide those features</td><td>Contract</td></tr>
          <tr><td>Leaderboard positions, achievements, who you follow, competition entries and a public profile look</td><td>Only for features you turn on or join (leaderboards, public profile, following, competitions)</td><td>Contract</td></tr>
          <tr><td>Your Discord id and answers in the bot&rsquo;s daily games</td><td>To score the games. No stakes and no prizes</td><td>Legitimate interests</td></tr>
          <tr><td>Notifications we send you, and whether a Discord DM was delivered</td><td>Your inbox and DM delivery</td><td>Contract</td></tr>
          <tr><td>Session records (browser type, when you last used it)</td><td>To keep you signed in and let you sign out other devices</td><td>Contract</td></tr>
          <tr><td>Plan, Stripe customer ID and subscription status (Stripe holds your card details, not us)</td><td>To provide what you paid for</td><td>Contract; legal obligation for tax records</td></tr>
          <tr><td>API keys (stored only as a hash) and webhook addresses you add</td><td>To let your own tools read your data and receive your alerts</td><td>Contract</td></tr>
          <tr><td>Gift codes you buy or redeem (stored only as a hash), and a creator code if you arrived through a creator&rsquo;s link</td><td>To deliver the gift; to pay the creator their share</td><td>Contract; legitimate interests</td></tr>
          <tr><td>IP address and request logs</td><td>Security, preventing abuse, rate limiting</td><td>Legitimate interests</td></tr>
          <tr><td>A log of privacy, billing and deletion actions</td><td>To show we did what you asked</td><td>Legal obligation (accountability)</td></tr>
        </tbody>
      </table>
      <p>
        Bazaar prices and Hypixel server status aren&rsquo;t personal data. We don&rsquo;t poll Hypixel to track players,
        and we don&rsquo;t build profiles of people who aren&rsquo;t on SkyStats.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Stripe</strong> processes payments.</li>
        <li><strong>Cloudflare</strong> carries traffic to our server and protects it from attacks.</li>
        <li><strong>Mojang</strong> confirms you own your Minecraft account; <strong>Hypixel</strong> receives your UUID when we look up your profiles.</li>
        <li><strong>mc-heads.net</strong> serves player head pictures, so your browser sends it your IP address when a page shows one.</li>
        <li><strong>Your own webhook</strong>: if you add one, we send your alerts to the address you chose.</li>
        <li><strong>Our error-tracking service</strong> (if switched on) receives crash reports with user ids, IP addresses, cookies and request contents removed.</li>
        <li><strong>Discord</strong> confirms your identity when you connect it, delivers DMs you opted into, and receives what the bot posts when you use it.</li>
      </ul>
      <p>
        Some of these companies process data outside the UK, for example in the United States. Where they do, transfers rely on the
        UK&ndash;US data bridge or the ICO&rsquo;s International Data Transfer Agreement or Addendum. Our server is in the UK.
      </p>

      <h2>How long we keep it</h2>
      <table>
        <thead>
          <tr><th>Data</th><th>Kept for</th></tr>
        </thead>
        <tbody>
          <tr><td>Money history</td><td>7 days on Free, 90 days on Pro, until you delete it on Max. After leaving a paid plan, older history is hidden for 30 days, then deleted.</td></tr>
          <tr><td>Play sessions and rare drops</td><td>The same as money history for your plan</td></tr>
          <tr><td>Notifications</td><td>90 days</td></tr>
          <tr><td>Daily game answers</td><td>30 days</td></tr>
          <tr><td>Account, profiles, Discord link, alerts, goals, notes and custom methods</td><td>Until you delete them or your account</td></tr>
          <tr><td>Sessions</td><td>30 days (browser) or 90 days (mod), then removed</td></tr>
          <tr><td>Request logs</td><td>Up to 30 days (searchable server logs: 14 days)</td></tr>
          <tr><td>Unredeemed gift codes</td><td>2 years, then they expire</td></tr>
          <tr><td>Billing records</td><td>6 years, as UK tax law requires (held by Stripe)</td></tr>
          <tr><td>Backups</td><td>Up to 30 days, then overwritten</td></tr>
        </tbody>
      </table>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, download or delete your data, and to object to or restrict how we use it. Download and deletion are
        instant in <Link href="/settings">Privacy and data</Link>. For anything else, email {LEGAL.contactEmail}. We reply within one month.
        You can also complain to the Information Commissioner&rsquo;s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
      </p>

      <h2>Children</h2>
      <p>
        Lots of SkyBlock players are under 18, so SkyStats is built to be safe for them by default: high privacy settings, no profiling
        and no ads. We don&rsquo;t ask for your age. If you&rsquo;re under 13, a parent or carer should set up SkyStats with you.
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>
        We use one cookie, <code>ss_session</code>, which keeps you signed in. It is strictly necessary, so it doesn&rsquo;t need consent.
        We don&rsquo;t use analytics, advertising or tracking cookies. If we ever add any, we&rsquo;ll ask first.
      </p>
      <p>
        Display choices you make (theme, chart colours, number style) and when your session was last refreshed are saved in your
        browser&rsquo;s local storage, only because you asked for them. They never leave your device. The site also stores its own
        files so it can open offline; your SkyStats data is never stored that way.
      </p>

      <h2>Changes</h2>
      <p>If we change this notice in a way that matters, we&rsquo;ll tell you on the site before it takes effect.</p>
    </main>
  );
}
