-- Promotions table for managing discounts and promotional pricing
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent', 'flat')),
  discount_value REAL NOT NULL CHECK(discount_value > 0),
  applies_to TEXT NOT NULL DEFAULT '["rent"]',
  container_sizes TEXT NOT NULL DEFAULT 'all',
  promo_code TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
