import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev, forward API paths to the local server so the app is always same-origin
// (exactly like production, where Caddy does the forwarding).
const api = process.env.VITE_API_PROXY ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/v1': api, '/healthz': api, '/readyz': api },
  },
});
