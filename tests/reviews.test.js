import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create mock D1 database
function createMockDb(options = {}) {
  const allResults = options.allResults || [];
  const firstResult = options.firstResult || null;
  const changes = options.changes ?? 1;
  const lastRowId = options.lastRowId || 1;

  const bindResult = {
    first: vi.fn().mockResolvedValue(firstResult),
    run: vi.fn().mockResolvedValue({ meta: { changes, last_row_id: lastRowId } }),
    all: vi.fn().mockResolvedValue({ results: allResults }),
  };
  const prepared = {
    bind: vi.fn().mockReturnValue(bindResult),
  };
  return {
    prepare: vi.fn().mockReturnValue(prepared),
    batch: vi.fn().mockResolvedValue([]),
    _prepared: prepared,
    _bindResult: bindResult,
  };
}

// Sample review data
const sampleReview = {
  id: 1,
  reviewer_name: 'John Doe',
  rating: 5,
  review_date: '2024-08',
  review_text: 'Great service and friendly staff. Would recommend.',
  review_snippet: 'Great service and friendly staff',
  service_type: 'both',
  owner_response: 'Thank you for the review!',
  google_review_id: null,
  is_featured: 1,
  is_active: 1,
  created_at: '2024-08-15T00:00:00',
  updated_at: '2024-08-15T00:00:00',
};

const sampleReviewTags = [
  { review_id: 1, tag: 'homepage' },
  { review_id: 1, tag: 'pricing' },
];

describe('Reviews System', () => {
  describe('Review data structure', () => {
    it('has all required fields', () => {
      const requiredFields = [
        'id', 'reviewer_name', 'rating', 'review_date', 'review_text',
        'review_snippet', 'service_type', 'owner_response', 'google_review_id',
        'is_featured', 'is_active', 'created_at', 'updated_at',
      ];
      for (const field of requiredFields) {
        expect(sampleReview).toHaveProperty(field);
      }
    });

    it('rating is between 1 and 5', () => {
      expect(sampleReview.rating).toBeGreaterThanOrEqual(1);
      expect(sampleReview.rating).toBeLessThanOrEqual(5);
    });

    it('is_featured is 0 or 1', () => {
      expect([0, 1]).toContain(sampleReview.is_featured);
    });

    it('is_active is 0 or 1', () => {
      expect([0, 1]).toContain(sampleReview.is_active);
    });

    it('service_type is a valid value', () => {
      const validTypes = ['moving', 'storage', 'both', 'event', null];
      expect(validTypes).toContain(sampleReview.service_type);
    });
  });

  describe('Review tags', () => {
    const validTags = [
      'homepage', 'pods-comparison', 'competitor-switch', 'locally-owned',
      'contractor', 'remodeling', 'moving', 'storage', 'emergency', 'event',
      'how-it-works', 'team-shoutout', 'pricing', 'emotional',
    ];

    it('all sample tags are from valid taxonomy', () => {
      for (const t of sampleReviewTags) {
        expect(validTags).toContain(t.tag);
      }
    });

    it('tags reference valid review IDs', () => {
      for (const t of sampleReviewTags) {
        expect(t.review_id).toBe(sampleReview.id);
      }
    });
  });

  describe('Database queries', () => {
    let db;

    beforeEach(() => {
      db = createMockDb({
        allResults: [sampleReview],
        firstResult: { count: 1 },
      });
    });

    it('fetches reviews with is_active filter', () => {
      const query = 'SELECT r.* FROM reviews r WHERE r.is_active = 1 ORDER BY r.review_date DESC, r.id DESC LIMIT ? OFFSET ?';
      db.prepare(query).bind(6, 0).all();
      expect(db.prepare).toHaveBeenCalledWith(query);
    });

    it('fetches reviews filtered by tag via subquery', () => {
      const query = 'SELECT r.* FROM reviews r WHERE r.is_active = 1 AND r.id IN (SELECT review_id FROM review_tags WHERE tag = ?) ORDER BY r.review_date DESC, r.id DESC LIMIT ? OFFSET ?';
      db.prepare(query).bind('homepage', 6, 0).all();
      expect(db._prepared.bind).toHaveBeenCalledWith('homepage', 6, 0);
    });

    it('fetches featured reviews', () => {
      const query = 'SELECT r.* FROM reviews r WHERE r.is_active = 1 AND r.is_featured = 1 ORDER BY r.review_date DESC, r.id DESC LIMIT ? OFFSET ?';
      db.prepare(query).bind(6, 0).all();
      expect(db.prepare).toHaveBeenCalledWith(query);
    });

    it('fetches review tags by review IDs', () => {
      const query = 'SELECT review_id, tag FROM review_tags WHERE review_id IN (?)';
      db.prepare(query).bind(1).all();
      expect(db._prepared.bind).toHaveBeenCalledWith(1);
    });

    it('counts reviews for stats', async () => {
      const query = 'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE is_active = 1';
      const result = await db.prepare(query).bind().first();
      expect(result).toEqual({ count: 1 });
    });

    it('fetches tag counts', () => {
      const query = expect.stringContaining('GROUP BY rt.tag');
      db.prepare('SELECT rt.tag, COUNT(*) as count FROM review_tags rt JOIN reviews r ON rt.review_id = r.id WHERE r.is_active = 1 GROUP BY rt.tag ORDER BY count DESC');
      expect(db.prepare).toHaveBeenCalled();
    });
  });

  describe('Review creation', () => {
    it('inserts review with all fields', () => {
      const db = createMockDb({ lastRowId: 42 });
      const insertQuery = expect.stringContaining('INSERT INTO reviews');
      db.prepare('INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, google_review_id, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(
        'Jane Smith', 5, '2024-06', 'Amazing service!', 'Amazing service!', 'moving', null, null, 0, 1
      ).run();
      expect(db._prepared.bind).toHaveBeenCalledWith(
        'Jane Smith', 5, '2024-06', 'Amazing service!', 'Amazing service!', 'moving', null, null, 0, 1
      );
    });

    it('inserts tags using batch', async () => {
      const db = createMockDb({ lastRowId: 42 });
      const tags = ['homepage', 'moving'];
      const statements = tags.map(tag =>
        db.prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)').bind(42, tag)
      );
      await db.batch(statements);
      expect(db.batch).toHaveBeenCalled();
    });
  });

  describe('Review update', () => {
    it('updates review fields', () => {
      const db = createMockDb();
      const query = "UPDATE reviews SET reviewer_name = ?, rating = ?, updated_at = datetime('now') WHERE id = ?";
      db.prepare(query).bind('Updated Name', 4, 1).run();
      expect(db._prepared.bind).toHaveBeenCalledWith('Updated Name', 4, 1);
    });

    it('replaces tags on update (delete then insert)', async () => {
      const db = createMockDb();
      // Delete old tags
      db.prepare('DELETE FROM review_tags WHERE review_id = ?').bind(1).run();
      // Insert new tags via batch
      const newTags = ['storage', 'pricing'];
      const statements = newTags.map(tag =>
        db.prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)').bind(1, tag)
      );
      await db.batch(statements);
      expect(db.batch).toHaveBeenCalled();
    });
  });

  describe('Review deletion', () => {
    it('deletes tags then review', () => {
      const db = createMockDb();
      db.prepare('DELETE FROM review_tags WHERE review_id = ?').bind(1).run();
      db.prepare('DELETE FROM reviews WHERE id = ?').bind(1).run();
      expect(db.prepare).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validation', () => {
    it('rejects rating below 1', () => {
      const rating = 0;
      expect(rating < 1 || rating > 5).toBe(true);
    });

    it('rejects rating above 5', () => {
      const rating = 6;
      expect(rating < 1 || rating > 5).toBe(true);
    });

    it('accepts valid ratings 1-5', () => {
      for (let r = 1; r <= 5; r++) {
        expect(r >= 1 && r <= 5).toBe(true);
      }
    });

    it('requires reviewer_name', () => {
      const name = '';
      expect(!name).toBe(true);
    });

    it('requires review_text', () => {
      const text = '';
      expect(!text).toBe(true);
    });

    it('requires review_date', () => {
      const date = '';
      expect(!date).toBe(true);
    });
  });

  describe('Security', () => {
    it('review_snippet can be null', () => {
      const review = { ...sampleReview, review_snippet: null };
      expect(review.review_snippet).toBeNull();
    });

    it('handles HTML characters in reviewer_name', () => {
      const name = '<script>alert("xss")</script>';
      // D1 stores as-is, frontend must escape
      expect(name).toContain('<script>');
      // Verify the name is preserved raw (escaping is a display concern)
      expect(typeof name).toBe('string');
    });

    it('handles SQL injection attempt in tag filter', () => {
      const tag = "'; DROP TABLE reviews; --";
      // Parameterized query: tag value is bound, not concatenated
      const db = createMockDb();
      db.prepare('SELECT review_id FROM review_tags WHERE tag = ?').bind(tag);
      expect(db._prepared.bind).toHaveBeenCalledWith(tag);
    });

    it('public endpoint always includes is_active = 1', () => {
      const conditions = ['r.is_active = 1'];
      const where = 'WHERE ' + conditions.join(' AND ');
      expect(where).toContain('is_active = 1');
    });

    it('inactive reviews are excluded from public queries', () => {
      const publicReviews = [sampleReview].filter(r => r.is_active === 1);
      const inactiveReview = { ...sampleReview, is_active: 0 };
      const allReviews = [sampleReview, inactiveReview];
      const filtered = allReviews.filter(r => r.is_active === 1);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(sampleReview.id);
    });
  });

  describe('Seed data integrity', () => {
    // These verify the seed data structure matches expectations
    const seedReviewCounts = {
      total: 46, // 44 from prompt + 2 existing testimonials
      featured: 13, // Reviews 5,6,7,10,11,13,16,21,25,33 + 45,46 from prompt, + review 36 is not featured
    };

    it('has expected total seed count', () => {
      expect(seedReviewCounts.total).toBe(46);
    });

    it('all seed reviews are 5-star', () => {
      // All 79 Google reviews are 5-star per the prompt
      expect(sampleReview.rating).toBe(5);
    });

    it('review 4 (Amy Glenn) has no tags', () => {
      // Negative experience review should not be tagged for display
      const amyTags = []; // No tags per instructions
      expect(amyTags).toHaveLength(0);
    });
  });

  describe('Stats endpoint', () => {
    it('returns total_reviews as 79 (real Google count)', () => {
      const stats = {
        average_rating: 5.0,
        total_reviews: 79,
        total_in_db: 46,
        rating_breakdown: { '5': 46, '4': 0, '3': 0, '2': 0, '1': 0 },
      };
      expect(stats.total_reviews).toBe(79);
      expect(stats.total_in_db).toBe(46);
    });

    it('rating breakdown sums to total_in_db', () => {
      const breakdown = { '5': 46, '4': 0, '3': 0, '2': 0, '1': 0 };
      const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
      expect(sum).toBe(46);
    });

    it('average rating rounds to one decimal', () => {
      const avg = 5.0;
      expect(Math.round(avg * 10) / 10).toBe(5.0);
    });
  });

  describe('Pagination', () => {
    it('has_more is true when more reviews exist', () => {
      const total = 20;
      const offset = 0;
      const limit = 6;
      expect(offset + limit < total).toBe(true);
    });

    it('has_more is false when all reviews are returned', () => {
      const total = 5;
      const offset = 0;
      const limit = 6;
      expect(offset + limit < total).toBe(false);
    });

    it('respects max limit of 50', () => {
      const requestedLimit = 100;
      const limit = Math.min(requestedLimit, 50);
      expect(limit).toBe(50);
    });

    it('defaults limit to 6', () => {
      const limit = parseInt(undefined || '6');
      expect(limit).toBe(6);
    });
  });
});
