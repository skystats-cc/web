import { createSkystatsClient } from '@skystats/api-client';

// Same-origin: Vite (dev) and Caddy (prod) forward /v1 and /healthz to the server,
// and the browser sends the HttpOnly session cookie automatically.
export const api = createSkystatsClient({ baseUrl: import.meta.env.VITE_API_URL ?? '' });
