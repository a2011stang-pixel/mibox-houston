import { Hono } from 'hono';
import type { Env } from '../index';

export const publicRoutes = new Hono<{ Bindings: Env }>();

publicRoutes.get('/pricing', async (c) => {
  const pricing = await c.env.DB
    .prepare('SELECT container_size, rate_type, amount FROM pricing')
    .all<{ container_size: string; rate_type: string; amount: number }>();

  const monthly: Record<string, Record<string, number>> = {};
  const firstMonth: Record<string, number> = {};

  for (const p of pricing.results || []) {
    if (p.rate_type === 'first_month') {
      firstMonth[p.container_size] = p.amount / 100;
    } else {
      if (!monthly[p.container_size]) {
        monthly[p.container_size] = {};
      }
      monthly[p.container_size][p.rate_type] = p.amount / 100;
    }
  }

  return c.json({
    monthly,
    first_month: firstMonth,
  });
});

publicRoutes.get('/pricing/:zip', async (c) => {
  const zip = c.req.param('zip');

  if (!/^\d{5}$/.test(zip)) {
    return c.json({ error: 'Invalid ZIP code format' }, 400);
  }

  const result = await c.env.DB
    .prepare(`
      SELECT zc.zip, z.id as zone_id, z.name as zone, z.display_name as zone_name,
             z.delivery_fee, z.pickup_fee, z.relocation_fee
      FROM zip_codes zc
      JOIN zones z ON zc.zone_id = z.id
      WHERE zc.zip = ? AND z.is_active = 1
    `)
    .bind(zip)
    .first<{
      zip: string;
      zone_id: number;
      zone: string;
      zone_name: string;
      delivery_fee: number;
      pickup_fee: number;
      relocation_fee: number;
    }>();

  if (!result) {
    return c.json({ error: 'ZIP code not in service area', zip }, 404);
  }

  const pricing = await c.env.DB
    .prepare('SELECT container_size, rate_type, amount FROM pricing')
    .all<{ container_size: string; rate_type: string; amount: number }>();

  const monthly: Record<string, Record<string, number>> = {};
  const firstMonth: Record<string, number> = {};

  for (const p of pricing.results || []) {
    if (p.rate_type === 'first_month') {
      firstMonth[p.container_size] = p.amount / 100;
    } else {
      if (!monthly[p.container_size]) {
        monthly[p.container_size] = {};
      }
      monthly[p.container_size][p.rate_type] = p.amount / 100;
    }
  }

  return c.json({
    zip: result.zip,
    zone: result.zone,
    zone_name: result.zone_name,
    delivery_fee: result.delivery_fee / 100,
    pickup_fee: result.pickup_fee / 100,
    relocation_fee: result.relocation_fee / 100,
    monthly,
    first_month: firstMonth,
    source: 'dynamic',
  });
});

publicRoutes.get('/active-promotions', async (c) => {
  const today = new Date().toISOString().split('T')[0];

  const promotions = await c.env.DB
    .prepare(`
      SELECT id, name, discount_type, discount_value, applies_to, container_sizes,
             start_date, end_date
      FROM promotions
      WHERE is_active = 1
        AND start_date <= ?
        AND end_date >= ?
        AND promo_code IS NULL
    `)
    .bind(today, today)
    .all();

  return c.json(
    { promotions: promotions.results || [] },
    200,
    { 'Cache-Control': 'public, max-age=300' }
  );
});

publicRoutes.get('/zones', async (c) => {
  const zones = await c.env.DB
    .prepare('SELECT id, name, display_name, delivery_fee, pickup_fee FROM zones WHERE is_active = 1')
    .all();

  return c.json({
    zones: (zones.results || []).map((z: any) => ({
      ...z,
      delivery_fee: z.delivery_fee / 100,
      pickup_fee: z.pickup_fee / 100,
    })),
  });
});
