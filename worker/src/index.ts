import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { zonesRoutes } from './routes/zones';
import { zipsRoutes } from './routes/zips';
import { pricingRoutes } from './routes/pricing';
import { auditRoutes } from './routes/audit';
import { publicRoutes } from './routes/public';
import { authMiddleware } from './middleware/auth';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS for admin UI
app.use('/api/*', cors({
  origin: ['https://miboxhouston.com', 'http://localhost:8787'],
  credentials: true,
}));

// Public routes (no auth required)
app.route('/api/public', publicRoutes);
app.route('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/zones/*', authMiddleware);
app.use('/api/zips/*', authMiddleware);
app.use('/api/pricing/*', authMiddleware);
app.use('/api/audit/*', authMiddleware);

app.route('/api/zones', zonesRoutes);
app.route('/api/zips', zipsRoutes);
app.route('/api/pricing', pricingRoutes);
app.route('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
