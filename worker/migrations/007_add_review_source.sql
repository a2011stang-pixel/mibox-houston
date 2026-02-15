-- Add source column to reviews table
ALTER TABLE reviews ADD COLUMN source TEXT NOT NULL DEFAULT 'google';
