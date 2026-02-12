import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { zonesRoutes } from './routes/zones';
import { zipsRoutes } from './routes/zips';
import { pricingRoutes } from './routes/pricing';
import { auditRoutes } from './routes/audit';
import { publicRoutes } from './routes/public';
import { quoteRoutes } from './routes/quote';
import { bookingRoutes } from './routes/booking';
import { getQuoteRoutes } from './routes/get-quote';
import { adminRoutes } from './routes/admin';
import { authMiddleware } from './middleware/auth';
import { runBackup } from './services/backup';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BACKUPS: R2Bucket;
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/api/*', cors({
  origin: [
    'https://miboxhouston.com',
    'https://www.miboxhouston.com',
    'https://houston.miboxhouston.com',
    'https://mibox-houston.pages.dev',
    'http://localhost:8787',
  ],
  credentials: true,
}));

// Public routes (no auth required)
app.route('/api/public', publicRoutes);
app.route('/api/public/quote', quoteRoutes);
app.route('/api/public/quote', getQuoteRoutes);
app.route('/api/public/booking', bookingRoutes);
app.route('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/zones/*', authMiddleware);
app.use('/api/zips/*', authMiddleware);
app.use('/api/pricing/*', authMiddleware);
app.use('/api/audit/*', authMiddleware);
app.use('/api/admin/*', authMiddleware);

app.route('/api/zones', zonesRoutes);
app.route('/api/zips', zipsRoutes);
app.route('/api/pricing', pricingRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,
  scheduled: async (
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ) => {
    ctx.waitUntil(runBackup(env));
  },
};
