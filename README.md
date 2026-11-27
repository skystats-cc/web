# skystats web

The skystats.cc website: Hypixel status, **Link Minecraft** (pairing with the mod), and **My profiles** (your SkyBlock profiles with co-op members). This is where the dashboard and bazaar pages will live.

**Stack:** Vite · React 19 · TypeScript · `@skystats/api-client` (typed client from `api-spec`) · Caddy (production)

## Dev

```bash
npm install
npm run dev        # http://localhost:5173
```

Run the server locally too (`npm run dev:api` in `server`). Vite forwards `/v1`, `/healthz`, `/readyz` to `http://localhost:3000`. Override with `VITE_API_PROXY=http://other-host:3000 npm run dev`.

## Linking Minecraft

`/link` asks the API for a pairing code and shows `/skystats link ABCD-EFGH` with a Copy button. The player pastes it in game and clicks **[Confirm]**; the mod proves their identity through Mojang and claims the code. The page polls every 2s and receives an HttpOnly session cookie when it's claimed.

## How it talks to the API

The app always calls the API **same-origin** (`/v1/...`). In dev Vite proxies it; in production the image's Caddy proxies it to `API_UPSTREAM` (default `api:3000`, the compose service). That means no CORS setup and no API URL baked into the build. `/admin*` returns 404 here, so admin routes never leak through the website.

## Production

`docker build .` produces a Caddy image with the built site in `/srv`. CI pushes `ghcr.io/skystats-cc/web` on merge to `main`; the `infra` repo runs it behind the Cloudflare Tunnel.

## Layout

```
src/
  App.tsx              layout + routes (/, /link, /me)
  pages/               HomePage, LinkPage (pairing code + copy command), ProfilesPage (profiles + co-op)
  components/          Header, StatusBar (site-wide "is SkyBlock down?"), StatusCard, PingCard
  lib/api.ts           the API client (cookie session, same-origin)
  lib/session.tsx      who's signed in (asks /v1/me; the cookie itself is HttpOnly)
  lib/router.tsx       tiny client-side router
  lib/usePoll.ts       polling hook (pauses when the tab is hidden)
  lib/status.ts, format.ts   helpers (+ tests)
```
