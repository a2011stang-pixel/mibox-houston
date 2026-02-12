-- Phase 1B: Quotes table for storing all quote and booking submissions
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'quoted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Service info (Step 1)
  service_type TEXT,
  service_display TEXT,
  box_size TEXT,
  delivery_zip TEXT,
  destination_zip TEXT,
  storage_duration TEXT,
  delivery_date TEXT,

  -- Contact info (Step 2)
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  how_heard TEXT,

  -- Pricing (Step 3)
  delivery_fee TEXT,
  first_month_rent TEXT,
  monthly_rent TEXT,
  due_today TEXT,
  ongoing_monthly TEXT,

  -- Booking details (Step 4, null until booked)
  delivery_address TEXT,
  city TEXT,
  state TEXT,
  placement TEXT,
  surface_type TEXT,
  door_facing TEXT,
  gate_code TEXT,
  notes TEXT,
  booked_at TEXT,

  -- Tracking
  lead_source TEXT DEFAULT 'Website',
  stella_forwarded INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
