-- Staff Quotes system for Ops Hub Quick Quote tool
-- Sequential quote numbers (QT-YYYY-NNNN), cents-based pricing, multi-container support

CREATE TABLE IF NOT EXISTS staff_quote_counter (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS staff_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- Customer
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT NOT NULL,
  -- Service
  service_type TEXT NOT NULL,
  delivery_date TEXT,
  months_needed INTEGER NOT NULL DEFAULT 1,
  -- Zone snapshot
  zone_id INTEGER,
  zone_name TEXT,
  delivery_fee_cents INTEGER NOT NULL,
  pickup_fee_cents INTEGER NOT NULL DEFAULT 0,
  relocation_fee_cents INTEGER NOT NULL DEFAULT 0,
  -- Container summary
  container_count INTEGER NOT NULL DEFAULT 1,
  -- Discounts
  multi_discount_percent REAL NOT NULL DEFAULT 0,
  promo_id INTEGER,
  promo_code TEXT,
  promo_discount_cents INTEGER NOT NULL DEFAULT 0,
  -- Override
  override_monthly_cents INTEGER,
  override_reason TEXT,
  -- Totals (cents)
  subtotal_monthly_cents INTEGER NOT NULL,
  discount_monthly_cents INTEGER NOT NULL DEFAULT 0,
  total_monthly_cents INTEGER NOT NULL,
  first_month_total_cents INTEGER NOT NULL,
  due_today_cents INTEGER NOT NULL,
  -- Staff tracking
  created_by TEXT NOT NULL,
  email_sent INTEGER NOT NULL DEFAULT 0,
  email_sent_at TEXT,
  stella_forwarded INTEGER NOT NULL DEFAULT 0,
  stella_order_id TEXT,
  converted_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS staff_quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  container_size TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  monthly_rate_cents INTEGER NOT NULL,
  first_month_rate_cents INTEGER NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES staff_quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sq_number ON staff_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_sq_status ON staff_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sq_zip ON staff_quotes(zip);
CREATE INDEX IF NOT EXISTS idx_sq_created ON staff_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_sqi_quote ON staff_quote_items(quote_id);
