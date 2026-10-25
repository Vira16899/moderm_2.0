import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { userDetailBridge } from './userDetailBridge.js';

const app = express();
const dist = fileURLToPath(new URL('../dist', import.meta.url));
app.use(userDetailBridge(process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_BASE_URL || 'https://backend.factory.work.gd'));
// Vite fingerprints these filenames, so repeat visits can reuse them safely.
app.use('/assets', express.static(`${dist}/assets`, { maxAge: '1y', immutable: true, fallthrough: false }));
app.use(express.static(dist));
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(`${dist}/index.html`);
});
app.listen(Number(process.env.PORT || 3000));
