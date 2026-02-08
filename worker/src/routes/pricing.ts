import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';

interface Pricing {
  id: number;
  container_size: string;
  rate_type: string;
  amount: number;
  created_at: number;
  updated_at: number;
}

export const pricingRoutes = new Hono<{ Bindings: Env }>();

pricingRoutes.get('/', async (c) => {
  const pricing = await c.env.DB
    .prepare('SELECT * FROM pricing ORDER BY container_size, rate_type')
    .all<Pricing>();

  const formatted: Record<string, Record<string, number>> = {};
  for (const p of pricing.results || []) {
    if (!formatted[p.container_size]) {
      formatted[p.container_size] = {};
    }
    formatted[p.container_size][p.rate_type] = p.amount;
  }

  return c.json({ pricing: formatted, raw: pricing.results || [] });
});

pricingRoutes.put('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    container_size: string;
    rate_type: string;
    amount: number;
  }>();

  if (!body.container_size || !body.rate_type || body.amount === undefined) {
    return c.json({ error: 'container_size, rate_type, and amount required' }, 400);
  }

  const oldPricing = await c.env.DB
    .prepare('SELECT * FROM pricing WHERE container_size = ? AND rate_type = ?')
    .bind(body.container_size, body.rate_type)
    .first<Pricing>();

  const now = Math.floor(Date.now() / 1000);

  if (oldPricing) {
    await c.env.DB
      .prepare('UPDATE pricing SET amount = ?, updated_at = ? WHERE container_size = ? AND rate_type = ?')
      .bind(body.amount, now, body.container_size, body.rate_type)
      .run();
  } else {
    await c.env.DB
      .prepare('INSERT INTO pricing (container_size, rate_type, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(body.container_size, body.rate_type, body.amount, now, now)
      .run();
  }

  const newPricing = await c.env.DB
    .prepare('SELECT * FROM pricing WHERE container_size = ? AND rate_type = ?')
    .bind(body.container_size, body.rate_type)
    .first<Pricing>();

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'pricing.update',
    'pricing',
    body.container_size + ':' + body.rate_type,
    oldPricing,
    newPricing,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ pricing: newPricing });
});
