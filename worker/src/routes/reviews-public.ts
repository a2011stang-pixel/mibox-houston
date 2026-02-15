import { Hono } from 'hono';
import type { Env } from '../index';
import type { Review } from '../types';

const reviewsPublicRoutes = new Hono<{ Bindings: Env }>();

// GET / — List published reviews with filtering and pagination
reviewsPublicRoutes.get('/', async (c) => {
  const tag = c.req.query('tag');
  const featured = c.req.query('featured');
  const limit = Math.min(parseInt(c.req.query('limit') || '6'), 50);
  const offset = parseInt(c.req.query('offset') || '0');
  const random = c.req.query('random');

  const conditions: string[] = ['r.is_active = 1'];
  const params: (string | number)[] = [];

  if (tag) {
    conditions.push('r.id IN (SELECT review_id FROM review_tags WHERE tag = ?)');
    params.push(tag);
  }

  if (featured === '1' || featured === 'true') {
    conditions.push('r.is_featured = 1');
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const orderBy = (random === '1' || random === 'true')
    ? 'ORDER BY RANDOM()'
    : 'ORDER BY r.review_date DESC, r.id DESC';

  // Get total count
  const countResult = await c.env.DB
    .prepare(`SELECT COUNT(*) as count FROM reviews r ${where}`)
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated reviews
  const reviews = await c.env.DB
    .prepare(`SELECT r.* FROM reviews r ${where} ${orderBy} LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all<Review>();
  const rows = reviews.results || [];

  // Batch-fetch tags for returned reviews
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
      id: r.id,
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      review_date: r.review_date,
      review_text: r.review_text,
      review_snippet: r.review_snippet,
      service_type: r.service_type,
      owner_response: r.owner_response,
      google_review_id: r.google_review_id,
      is_featured: r.is_featured,
      is_active: r.is_active,
      created_at: r.created_at,
      updated_at: r.updated_at,
      tags: tagsByReview.get(r.id) || [],
    }));
  }

  return c.json({
    reviews: reviewsWithTags,
    total,
    has_more: offset + limit < total,
  });
});

// GET /stats — Aggregate review statistics
reviewsPublicRoutes.get('/stats', async (c) => {
  const stats = await c.env.DB
    .prepare('SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE is_active = 1')
    .first<{ total: number; avg_rating: number }>();

  const breakdown = await c.env.DB
    .prepare('SELECT rating, COUNT(*) as count FROM reviews WHERE is_active = 1 GROUP BY rating ORDER BY rating DESC')
    .all<{ rating: number; count: number }>();

  const ratingBreakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  for (const row of breakdown.results || []) {
    ratingBreakdown[String(row.rating)] = row.count;
  }

  return c.json({
    average_rating: stats?.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0,
    total_reviews: 79, // Real Google review count (DB has subset seeded)
    total_in_db: stats?.total || 0,
    rating_breakdown: ratingBreakdown,
  });
});

// GET /tags — All tags with counts
reviewsPublicRoutes.get('/tags', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT rt.tag, COUNT(*) as count
       FROM review_tags rt
       JOIN reviews r ON rt.review_id = r.id
       WHERE r.is_active = 1
       GROUP BY rt.tag
       ORDER BY count DESC`
    )
    .all<{ tag: string; count: number }>();

  return c.json({
    tags: result.results || [],
  });
});

export { reviewsPublicRoutes };
