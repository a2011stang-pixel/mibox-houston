import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';

interface Zone {
  id: number;
  name: string;
  display_name: string;
  delivery_fee: number;
  pickup_fee: number;
  relocation_fee: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export const zonesRoutes = new Hono<{ Bindings: Env }>();

zonesRoutes.get('/', async (c) => {
  const zones = await c.env.DB
    .prepare(`
      SELECT z.*, COUNT(zc.zip) as zip_count 
      FROM zones z 
      LEFT JOIN zip_codes zc ON z.id = zc.zone_id 
      GROUP BY z.id 
      ORDER BY z.name
    `)
    .all();

  return c.json({ zones: zones.results || [] });
});

zonesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const zone = await c.env.DB
    .prepare('SELECT * FROM zones WHERE id = ?')
    .bind(id)
    .first<Zone>();

  if (!zone) {
    return c.json({ error: 'Zone not found' }, 404);
  }

  return c.json({ zone });
});

zonesRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    name: string;
    display_name: string;
    delivery_fee: number;
    pickup_fee: number;
    relocation_fee: number;
  }>();

  if (!body.name || !body.display_name) {
    return c.json({ error: 'Name and display name required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  
  try {
    await c.env.DB
      .prepare(`
        INSERT INTO zones (name, display_name, delivery_fee, pickup_fee, relocation_fee, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `)
      .bind(
        body.name,
        body.display_name,
        body.delivery_fee || 0,
        body.pickup_fee || 0,
        body.relocation_fee || 0,
        now,
        now
      )
      .run();

    const zone = await c.env.DB
      .prepare('SELECT * FROM zones WHERE name = ?')
      .bind(body.name)
      .first<Zone>();

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'zone.create',
      'zone',
      zone?.id.toString() || null,
      null,
      zone,
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ zone }, 201);
  } catch {
    return c.json({ error: 'Zone name already exists' }, 409);
  }
});

zonesRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json<{
    display_name?: string;
    delivery_fee?: number;
    pickup_fee?: number;
    relocation_fee?: number;
    is_active?: number;
  }>();

  const oldZone = await c.env.DB
    .prepare('SELECT * FROM zones WHERE id = ?')
    .bind(id)
    .first<Zone>();

  if (!oldZone) {
    return c.json({ error: 'Zone not found' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  
  await c.env.DB
    .prepare(`
      UPDATE zones SET 
        display_name = COALESCE(?, display_name),
        delivery_fee = COALESCE(?, delivery_fee),
        pickup_fee = COALESCE(?, pickup_fee),
        relocation_fee = COALESCE(?, relocation_fee),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `)
    .bind(
      body.display_name || null,
      body.delivery_fee ?? null,
      body.pickup_fee ?? null,
      body.relocation_fee ?? null,
      body.is_active ?? null,
      now,
      id
    )
    .run();

  const newZone = await c.env.DB
    .prepare('SELECT * FROM zones WHERE id = ?')
    .bind(id)
    .first<Zone>();

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'zone.update',
    'zone',
    id,
    oldZone,
    newZone,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ zone: newZone });
});

zonesRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const zone = await c.env.DB
    .prepare('SELECT * FROM zones WHERE id = ?')
    .bind(id)
    .first<Zone>();

  if (!zone) {
    return c.json({ error: 'Zone not found' }, 404);
  }

  const zipCount = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM zip_codes WHERE zone_id = ?')
    .bind(id)
    .first<{ count: number }>();

  if (zipCount && zipCount.count > 0) {
    return c.json({ error: 'Cannot delete zone with assigned ZIP codes' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM zones WHERE id = ?').bind(id).run();

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'zone.delete',
    'zone',
    id,
    zone,
    null,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ success: true });
});
