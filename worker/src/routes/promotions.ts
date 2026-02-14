import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';

interface Promotion {
  id: number;
  name: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  applies_to: string;
  container_sizes: string;
  promo_code: string | null;
  start_date: string;
  end_date: string;
  is_active: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const promotionsRoutes = new Hono<{ Bindings: Env }>();

// List all promotions
promotionsRoutes.get('/', async (c) => {
  const promotions = await c.env.DB
    .prepare('SELECT * FROM promotions ORDER BY created_at DESC')
    .all<Promotion>();

  return c.json({ promotions: promotions.results || [] });
});

// Create promotion
promotionsRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      name: string;
      discount_type: 'percent' | 'flat';
      discount_value: number;
      applies_to: string;
      container_sizes: string;
      promo_code?: string;
      start_date: string;
      end_date: string;
      is_active?: number;
      notes?: string;
    }>();

    if (!body.name || !body.name.trim()) {
      return c.json({ error: 'Promotion name is required' }, 400);
    }

    if (!body.discount_type || !['percent', 'flat'].includes(body.discount_type)) {
      return c.json({ error: 'Discount type must be percent or flat' }, 400);
    }

    if (!body.discount_value || body.discount_value <= 0) {
      return c.json({ error: 'Discount value must be greater than 0' }, 400);
    }

    if (body.discount_type === 'percent' && body.discount_value > 100) {
      return c.json({ error: 'Percentage discount cannot exceed 100' }, 400);
    }

    if (!body.applies_to) {
      return c.json({ error: 'Applies to is required' }, 400);
    }

    let appliesTo: string[];
    try {
      appliesTo = JSON.parse(body.applies_to);
      if (!Array.isArray(appliesTo) || appliesTo.length === 0) {
        return c.json({ error: 'At least one applies_to option is required' }, 400);
      }
    } catch {
      return c.json({ error: 'Invalid applies_to format' }, 400);
    }

    if (!body.start_date || !body.end_date) {
      return c.json({ error: 'Start date and end date are required' }, 400);
    }

    if (body.end_date <= body.start_date) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const containerSizes = body.container_sizes || 'all';
    if (!['all', '16', '20'].includes(containerSizes)) {
      return c.json({ error: 'Container sizes must be all, 16, or 20' }, 400);
    }

    const now = new Date().toISOString().replace('T', ' ').split('.')[0];

    await c.env.DB
      .prepare(`
        INSERT INTO promotions (name, discount_type, discount_value, applies_to, container_sizes, promo_code, start_date, end_date, is_active, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.name.trim(),
        body.discount_type,
        body.discount_value,
        body.applies_to,
        containerSizes,
        body.promo_code || null,
        body.start_date,
        body.end_date,
        body.is_active ?? 1,
        body.notes || null,
        user.email,
        now,
        now
      )
      .run();

    const promotion = await c.env.DB
      .prepare('SELECT * FROM promotions WHERE name = ? ORDER BY id DESC LIMIT 1')
      .bind(body.name.trim())
      .first<Promotion>();

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'promotion.create',
      'promotion',
      promotion?.id.toString() || null,
      null,
      promotion,
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ promotion }, 201);
  } catch (err) {
    console.error('Promotion create error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create promotion';
    return c.json({ error: message }, 500);
  }
});

// Update promotion
promotionsRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json<{
      name?: string;
      discount_type?: 'percent' | 'flat';
      discount_value?: number;
      applies_to?: string;
      container_sizes?: string;
      promo_code?: string | null;
      start_date?: string;
      end_date?: string;
      is_active?: number;
      notes?: string | null;
    }>();

    const oldPromo = await c.env.DB
      .prepare('SELECT * FROM promotions WHERE id = ?')
      .bind(id)
      .first<Promotion>();

    if (!oldPromo) {
      return c.json({ error: 'Promotion not found' }, 404);
    }

    if (body.discount_type && !['percent', 'flat'].includes(body.discount_type)) {
      return c.json({ error: 'Discount type must be percent or flat' }, 400);
    }

    if (body.discount_value !== undefined && body.discount_value <= 0) {
      return c.json({ error: 'Discount value must be greater than 0' }, 400);
    }

    const discountType = body.discount_type || oldPromo.discount_type;
    const discountValue = body.discount_value ?? oldPromo.discount_value;
    if (discountType === 'percent' && discountValue > 100) {
      return c.json({ error: 'Percentage discount cannot exceed 100' }, 400);
    }

    if (body.container_sizes && !['all', '16', '20'].includes(body.container_sizes)) {
      return c.json({ error: 'Container sizes must be all, 16, or 20' }, 400);
    }

    const startDate = body.start_date ?? oldPromo.start_date;
    const endDate = body.end_date ?? oldPromo.end_date;
    if (startDate && endDate && endDate <= startDate) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const now = new Date().toISOString().replace('T', ' ').split('.')[0];

    // Build final values using old promo as defaults
    const updated = {
      name: body.name?.trim() || oldPromo.name,
      discount_type: discountType,
      discount_value: discountValue,
      applies_to: body.applies_to || oldPromo.applies_to,
      container_sizes: body.container_sizes || oldPromo.container_sizes,
      promo_code: 'promo_code' in body ? (body.promo_code || null) : oldPromo.promo_code,
      start_date: startDate,
      end_date: endDate,
      is_active: body.is_active ?? oldPromo.is_active,
      notes: 'notes' in body ? (body.notes || null) : oldPromo.notes,
    };

    await c.env.DB
      .prepare(`
        UPDATE promotions SET
          name = ?, discount_type = ?, discount_value = ?, applies_to = ?,
          container_sizes = ?, promo_code = ?, start_date = ?, end_date = ?,
          is_active = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        updated.name,
        updated.discount_type,
        updated.discount_value,
        updated.applies_to,
        updated.container_sizes,
        updated.promo_code,
        updated.start_date,
        updated.end_date,
        updated.is_active,
        updated.notes,
        now,
        id
      )
      .run();

    const newPromo = await c.env.DB
      .prepare('SELECT * FROM promotions WHERE id = ?')
      .bind(id)
      .first<Promotion>();

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'promotion.update',
      'promotion',
      id,
      oldPromo,
      newPromo,
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ promotion: newPromo });
  } catch (err) {
    console.error('Promotion update error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update promotion';
    return c.json({ error: message }, 500);
  }
});

// Delete promotion
promotionsRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const promotion = await c.env.DB
      .prepare('SELECT * FROM promotions WHERE id = ?')
      .bind(id)
      .first<Promotion>();

    if (!promotion) {
      return c.json({ error: 'Promotion not found' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM promotions WHERE id = ?').bind(id).run();

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'promotion.delete',
      'promotion',
      id,
      promotion,
      null,
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ success: true });
  } catch (err) {
    console.error('Promotion delete error:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete promotion';
    return c.json({ error: message }, 500);
  }
});
