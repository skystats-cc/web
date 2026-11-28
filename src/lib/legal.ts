// Facts the legal pages need. FILL THESE IN before launch: UK GDPR requires the controller's
// identity and contact details in the privacy notice, and consumer law requires the trader's
// name and geographic address before anyone pays.
export const LEGAL = {
  controllerName: 'TODO: legal name of the person or company running SkyStats.cc',
  contactEmail: 'TODO: privacy@skystats.cc',
  postalAddress: 'TODO: geographic address (UK consumer law)',
  icoRegistration: 'TODO: ICO registration number (data protection fee)',
  lastUpdated: '27 November 2026',
};

export const PLANS = [
  { tier: 'free', name: 'Free', monthly: 0, yearly: 0, retention: '7 days', modules: 'Basic money-making methods' },
  { tier: 'pro', name: 'Pro', monthly: 4.99, yearly: null, retention: '90 days', modules: 'Advanced methods, alerts and DMs' },
  { tier: 'max', name: 'Max', monthly: 12.99, yearly: null, retention: 'Unlimited', modules: 'Everything, plus custom and beta methods' },
] as const;

export const gbp = (n: number) => (n === 0 ? '£0' : `£${n.toFixed(2)}`);
