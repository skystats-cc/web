import { LEGAL } from '../../lib/legal';
import { Link } from '../../lib/router';

export function Terms() {
  return (
    <main className="wrap narrow legal">
      <h1 className="page-title">Terms</h1>
      <p className="muted">Last updated {LEGAL.lastUpdated}</p>

      <h2>1. About these terms</h2>
      <p>
        These terms are between you and {LEGAL.controllerName} ({LEGAL.postalAddress}, {LEGAL.contactEmail}), who runs SkyStats.cc.
        NOT AN OFFICIAL MINECRAFT SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT. SkyStats is not affiliated with Hypixel.
      </p>

      <h2>2. Your account</h2>
      <p>
        Your SkyStats account is linked to your Minecraft account. Keep your devices secure, and sign out of any you don&rsquo;t recognise.
        If you&rsquo;re under 18, please check with a parent or carer before using paid plans.
      </p>

      <h2>3. Fair use</h2>
      <p>
        Don&rsquo;t use SkyStats to break Hypixel&rsquo;s rules, to harass or track other players, or to overload or attack the service.
        We may suspend accounts that do.
      </p>

      <h2>4. Paid plans</h2>
      <ul>
        <li>Pro is £4.99 a month and Max is £12.99 a month, including VAT. The price shown at checkout is the total you pay.</li>
        <li>Plans start as soon as you pay and renew every month until you cancel. We&rsquo;ll tell you before any price change takes effect, and you can cancel before it does.</li>
        <li>You can cancel at any time on the <Link href="/billing">billing page</Link>. You keep paid features until the end of the month you&rsquo;ve paid for.</li>
        <li><strong>14-day right to cancel:</strong> you can cancel within 14 days of buying and get a full refund. Cancel on the billing page or email {LEGAL.contactEmail}.</li>
        <li>If a payment fails, paid features stay on for 7 days. After that your account moves to Free.</li>
        <li>When you move to a lower plan, history older than that plan keeps is hidden for 30 days and then deleted.</li>
      </ul>

      <h2>5. The service</h2>
      <p>
        SkyStats depends on Hypixel, Mojang and the SkyStats mod, so data can be late, missing or wrong. Prices and estimates are for
        information only. We may change features, but if a change makes a paid plan meaningfully worse, you can cancel and get a refund for the
        unused part.
      </p>

      <h2>6. Our responsibility to you</h2>
      <p>
        Nothing in these terms limits your rights under UK consumer law, or our responsibility for death or personal injury caused by
        negligence, or for fraud. Otherwise we&rsquo;re responsible for losses that are a foreseeable result of us breaking these terms,
        up to what you&rsquo;ve paid us in the last 12 months.
      </p>

      <h2>7. Ending your account</h2>
      <p>You can delete your account at any time in <Link href="/settings">Privacy and data</Link>. Deleting it cancels any paid plan.</p>

      <h2>8. Law</h2>
      <p>
        These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland, you can also bring claims in
        your local courts. Questions or complaints: {LEGAL.contactEmail}.
      </p>
    </main>
  );
}
