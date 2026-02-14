-- Per-item service type and address fields for Advanced Quote
ALTER TABLE staff_quote_items ADD COLUMN service_type TEXT;
ALTER TABLE staff_quote_items ADD COLUMN address_1 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN apt_1 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN city_1 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN state_1 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN zip_1 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN address_2 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN apt_2 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN city_2 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN state_2 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN zip_2 TEXT;
ALTER TABLE staff_quote_items ADD COLUMN zone_id INTEGER;
ALTER TABLE staff_quote_items ADD COLUMN zone_name TEXT;
ALTER TABLE staff_quote_items ADD COLUMN delivery_fee_cents INTEGER DEFAULT 0;

-- Quote type on parent table
ALTER TABLE staff_quotes ADD COLUMN quote_type TEXT DEFAULT 'quick';
