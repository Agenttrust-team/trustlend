// Vercel entrypoint: HTTP API only. Scheduled work runs through the authenticated
// maintenance endpoint; the long-lived local/Docker server remains src/index.ts.
import express from 'express';
import api from './src/app.js';

for (const name of ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'INTERNAL_API_KEY', 'FRONTEND_URL']) {
  if (!process.env[name]) throw new Error(`${name} is required for TrustLend API`);
}
const app = express();
app.use(api);
export default app;
