// ─────────────────────────────────────────────────────────────
// index.ts — Express server entry point for FinGuard API
// Mounts workflow, decisions, and review routers under /api.
// ─────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve .env relative to the server package root (apps/server/.env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverRoot, '.env') });
// Also try monorepo root .env as fallback
dotenv.config({ path: path.resolve(serverRoot, '..', '..', '.env') });

import express, { type Request, type Response, type NextFunction } from 'express';
import type { Express } from 'express';
import cors from 'cors';

import type { ApiResponse } from '@finguard/shared';

import { workflowRouter } from './routes/workflow.routes.js';
import { decisionsRouter } from './routes/decisions.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import studioRouter from './routes/studio.routes.js';

// ── App initialization ───────────────────────────────────────

// Explicit type annotation to avoid TS2742 with pnpm hoisting
const app: Express = express();
const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

// ── Middleware ────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'ok' },
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// ── Route mounting ───────────────────────────────────────────

app.use('/api/workflow', workflowRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/review', reviewRouter);
app.use('/api/studio', studioRouter);

// ── Global error handler ─────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[FinGuard API Error]', err.message);

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
});

// ── Server start ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🛡️  FinGuard API running on http://localhost:${PORT}`);
  console.log(`   ├── POST /api/workflow/run`);
  console.log(`   ├── GET  /api/decisions`);
  console.log(`   ├── GET  /api/decisions/:id`);
  console.log(`   ├── GET  /api/review/pending`);
  console.log(`   ├── POST /api/review/submit`);
  console.log(`   └── POST /api/studio/generate`);
});

export default app;
