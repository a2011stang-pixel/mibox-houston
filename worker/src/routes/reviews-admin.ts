import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';
import type { Review } from '../types';

const reviewsAdminRoutes = new Hono<{ Bindings: Env }>();

// GET / — List all reviews (including inactive) with filtering
reviewsAdminRoutes.get('/', async (c) => {
  const tag = c.req.query('tag');
  const featured = c.req.query('featured');
  const active = c.req.query('active');
  const search = c.req.query('search');
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 200);
  const offset = parseInt(c.req.query('offset') || '0');

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (tag) {
    conditions.push('r.id IN (SELECT review_id FROM review_tags WHERE tag = ?)');
    params.push(tag);
  }

  if (featured === '1' || featured === 'true') {
    conditions.push('r.is_featured = 1');
  } else if (featured === '0' || featured === 'false') {
    conditions.push('r.is_featured = 0');
  }

  if (active === '1' || active === 'true') {
    conditions.push('r.is_active = 1');
  } else if (active === '0' || active === 'false') {
    conditions.push('r.is_active = 0');
  }

  if (search) {
    conditions.push('(r.reviewer_name LIKE ? OR r.review_text LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await c.env.DB
    .prepare(`SELECT COUNT(*) as count FROM reviews r ${where}`)
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const reviews = await c.env.DB
    .prepare(`SELECT r.* FROM reviews r ${where} ORDER BY r.review_date DESC, r.id DESC LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all<Review>();
  const rows = reviews.results || [];

  // Batch-fetch tags
  let reviewsWithTags: (Review & { tags: string[] })[] = [];
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const tagsResult = await c.env.DB
      .prepare(`SELECT review_id, tag FROM review_tags WHERE review_id IN (${placeholders})`)
      .bind(...ids)
      .all<{ review_id: number; tag: string }>();
    const tagsByReview = new Map<number, string[]>();
    for (const t of tagsResult.results || []) {
      const arr = tagsByReview.get(t.review_id) || [];
      arr.push(t.tag);
      tagsByReview.set(t.review_id, arr);
    }
    reviewsWithTags = rows.map((r) => ({
      ...r,
      tags: tagsByReview.get(r.id) || [],
    }));
  }

  return c.json({ reviews: reviewsWithTags, total, limit, offset });
});

// POST / — Create a new review
reviewsAdminRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, owner_response, google_review_id, is_featured, is_active, tags } = body;

  if (!reviewer_name || !review_text || !review_date) {
    return c.json({ error: 'reviewer_name, review_text, and review_date are required' }, 400);
  }

  const ratingNum = parseInt(rating) || 5;
  if (ratingNum < 1 || ratingNum > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  const result = await c.env.DB
    .prepare(
      `INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, owner_response, google_review_id, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      reviewer_name,
      ratingNum,
      review_date,
      review_text,
      review_snippet || null,
      service_type || null,
      source || 'google',
      owner_response || null,
      google_review_id || null,
      is_featured ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    )
    .run();

  const reviewId = result.meta?.last_row_id;

  // Insert tags
  if (tags && Array.isArray(tags) && tags.length > 0 && reviewId) {
    const statements = tags.map((tag: string) =>
      c.env.DB
        .prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)')
        .bind(reviewId, tag.trim().toLowerCase())
    );
    await c.env.DB.batch(statements);
  }

  // Audit log
  const user = c.get('user');
  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'review.create',
    'review',
    String(reviewId),
    null,
    JSON.stringify({ reviewer_name, rating: ratingNum, tags }),
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ id: reviewId, message: 'Review created' }, 201);
});

// PUT /:id — Update a review
reviewsAdminRoutes.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const existing = await c.env.DB
    .prepare('SELECT * FROM reviews WHERE id = ?')
    .bind(id)
    .first<Review>();

  if (!existing) {
    return c.json({ error: 'Review not found' }, 404);
  }

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  const fields: Array<{ key: string; value: unknown }> = [
    { key: 'reviewer_name', value: body.reviewer_name },
    { key: 'rating', value: body.rating },
    { key: 'review_date', value: body.review_date },
    { key: 'review_text', value: body.review_text },
    { key: 'review_snippet', value: body.review_snippet },
    { key: 'service_type', value: body.service_type },
    { key: 'source', value: body.source },
    { key: 'owner_response', value: body.owner_response },
    { key: 'google_review_id', value: body.google_review_id },
    { key: 'is_featured', value: body.is_featured },
    { key: 'is_active', value: body.is_active },
  ];

  for (const { key, value } of fields) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      if (key === 'is_featured' || key === 'is_active') {
        params.push(value ? 1 : 0);
      } else if (key === 'rating') {
        const r = parseInt(value as string);
        if (r < 1 || r > 5) {
          return c.json({ error: 'Rating must be between 1 and 5' }, 400);
        }
        params.push(r);
      } else {
        params.push((value as string | number | null) ?? null);
      }
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    await c.env.DB
      .prepare(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params, id)
      .run();
  }

  // Update tags if provided
  if (body.tags !== undefined && Array.isArray(body.tags)) {
    await c.env.DB.prepare('DELETE FROM review_tags WHERE review_id = ?').bind(id).run();
    if (body.tags.length > 0) {
      const statements = body.tags.map((tag: string) =>
        c.env.DB
          .prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)')
          .bind(id, tag.trim().toLowerCase())
      );
      await c.env.DB.batch(statements);
    }
  }

  // Audit log
  const user = c.get('user');
  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'review.update',
    'review',
    String(id),
    JSON.stringify(existing),
    JSON.stringify(body),
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ message: 'Review updated' });
});

// DELETE /:id — Delete a review
reviewsAdminRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const existing = await c.env.DB
    .prepare('SELECT * FROM reviews WHERE id = ?')
    .bind(id)
    .first<Review>();

  if (!existing) {
    return c.json({ error: 'Review not found' }, 404);
  }

  // Delete tags first (in case FK cascade isn't enabled)
  await c.env.DB.prepare('DELETE FROM review_tags WHERE review_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();

  // Audit log
  const user = c.get('user');
  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'review.delete',
    'review',
    String(id),
    JSON.stringify(existing),
    null,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ message: 'Review deleted' });
});

// PUT /:id/featured — Toggle featured status
reviewsAdminRoutes.put('/:id/featured', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const existing = await c.env.DB
    .prepare('SELECT id, is_featured FROM reviews WHERE id = ?')
    .bind(id)
    .first<{ id: number; is_featured: number }>();

  if (!existing) {
    return c.json({ error: 'Review not found' }, 404);
  }

  const newValue = body.is_featured ? 1 : 0;
  await c.env.DB
    .prepare("UPDATE reviews SET is_featured = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newValue, id)
    .run();

  const user = c.get('user');
  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'review.update',
    'review',
    String(id),
    JSON.stringify({ is_featured: existing.is_featured }),
    JSON.stringify({ is_featured: newValue }),
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ message: 'Featured status updated', is_featured: newValue });
});

// PUT /:id/active — Toggle active status
reviewsAdminRoutes.put('/:id/active', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const existing = await c.env.DB
    .prepare('SELECT id, is_active FROM reviews WHERE id = ?')
    .bind(id)
    .first<{ id: number; is_active: number }>();

  if (!existing) {
    return c.json({ error: 'Review not found' }, 404);
  }

  const newValue = body.is_active ? 1 : 0;
  await c.env.DB
    .prepare("UPDATE reviews SET is_active = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newValue, id)
    .run();

  const user = c.get('user');
  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'review.update',
    'review',
    String(id),
    JSON.stringify({ is_active: existing.is_active }),
    JSON.stringify({ is_active: newValue }),
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ message: 'Active status updated', is_active: newValue });
});

export { reviewsAdminRoutes };
