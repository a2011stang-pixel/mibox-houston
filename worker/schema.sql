-- MiBox Houston Admin Dashboard Database Schema
-- Run with: npx wrangler d1 execute mibox-houston --file=schema.sql

-- Users with MFA support
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    locked_until INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Sessions for JWT management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Delivery zones
CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    delivery_fee INTEGER NOT NULL,
    pickup_fee INTEGER NOT NULL,
    relocation_fee INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- ZIP code assignments
CREATE TABLE IF NOT EXISTS zip_codes (
    zip TEXT PRIMARY KEY,
    zone_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);

-- Global pricing (container rates)
CREATE TABLE IF NOT EXISTS pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_size TEXT NOT NULL,
    rate_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(container_size, rate_type)
);

-- Immutable audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zip_codes_zone ON zip_codes(zone_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Seed initial zones (from current lib.js pricing)
INSERT OR IGNORE INTO zones (id, name, display_name, delivery_fee, pickup_fee, relocation_fee, is_active, created_at, updated_at)
VALUES 
    (1, 'zone1', 'Houston Metro', 7900, 7900, 7900, 1, strftime('%s','now'), strftime('%s','now')),
    (2, 'zone2', 'Conroe/Woodlands', 9900, 9900, 9900, 1, strftime('%s','now'), strftime('%s','now')),
    (3, 'zone3', 'Extended Area', 12900, 12900, 12900, 1, strftime('%s','now'), strftime('%s','now'));

-- Seed initial pricing
INSERT OR IGNORE INTO pricing (container_size, rate_type, amount, created_at, updated_at)
VALUES
    ('16', 'onsite', 18900, strftime('%s','now'), strftime('%s','now')),
    ('16', 'facility_inside', 24900, strftime('%s','now'), strftime('%s','now')),
    ('16', 'facility_outside', 19900, strftime('%s','now'), strftime('%s','now')),
    ('16', 'first_month', 11900, strftime('%s','now'), strftime('%s','now')),
    ('20', 'onsite', 22900, strftime('%s','now'), strftime('%s','now')),
    ('20', 'facility_inside', 29900, strftime('%s','now'), strftime('%s','now')),
    ('20', 'facility_outside', 24900, strftime('%s','now'), strftime('%s','now')),
    ('20', 'first_month', 17900, strftime('%s','now'), strftime('%s','now'));
