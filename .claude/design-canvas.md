# Phase 1B: D1 Database + Quote ID + Book Now Pre-fill

## Architecture Overview

Add a D1 `quotes` table to the existing `mibox-houston` D1 database. Generate a unique quote ID (Q-XXXXX) for every quote submission. Include the quote ID and a "Book Now" pre-fill link in the quote confirmation email. When a customer clicks the link, the frontend fetches quote data and pre-fills the booking form (Step 4).

## Data Flow

```
Customer fills Step 1-3 → POST /api/public/quote
  → Generate Q-XXXXX
  → INSERT into D1 quotes table (status: quoted)
  → Send email via Resend (includes quote ID + Book Now link)
  → Forward to Stella CRM (waitUntil, non-blocking)
  → Update D1 flags (email_sent, stella_forwarded)
  → Return { status: ok, quoteId: Q-XXXXX }

Customer clicks "Book Now" link → houston.miboxhouston.com/?quoteId=Q-XXXXX
  → Frontend detects ?quoteId= param
  → GET /api/public/quote/Q-XXXXX
  → Return quote data (service, contact, pricing fields)
  → Pre-fill form fields, skip to Step 4
  → Customer completes Step 4 → POST /api/public/booking (with quoteId)
  → UPDATE D1: status → booked, add Step 4 fields
  → Send booking confirmation email
  → Forward to Stella CRM
```

## D1 Schema (quotes table)

Use the existing `mibox-houston` D1 database (binding: DB). Add `quotes` table.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | Internal ID |
| quote_id | TEXT UNIQUE NOT NULL | Q-XXXXX format |
| status | TEXT NOT NULL DEFAULT 'quoted' | quoted / booked / expired / cancelled |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |
| service_type | TEXT | storage, moving, both |
| service_display | TEXT | Human-readable service name |
| box_size | TEXT | 8x16 or 8x20 |
| delivery_zip | TEXT | |
| destination_zip | TEXT | |
| storage_duration | TEXT | |
| delivery_date | TEXT | |
| first_name | TEXT | |
| last_name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| company | TEXT | |
| how_heard | TEXT | |
| delivery_fee | TEXT | "$79.00" formatted |
| first_month_rent | TEXT | |
| monthly_rent | TEXT | |
| due_today | TEXT | |
| ongoing_monthly | TEXT | |
| delivery_address | TEXT | null until booked |
| city | TEXT | |
| state | TEXT | |
| placement | TEXT | |
| surface_type | TEXT | |
| door_facing | TEXT | |
| gate_code | TEXT | |
| notes | TEXT | |
| booked_at | TEXT | ISO timestamp when booked |
| lead_source | TEXT DEFAULT 'Website' | |
| stella_forwarded | INTEGER DEFAULT 0 | |
| email_sent | INTEGER DEFAULT 0 | |
| sms_sent | INTEGER DEFAULT 0 | |

Indexes: quote_id, email, status, created_at

## Quote ID Generation

- Charset: `2346789ABCDEFGHJKMNPQRTUVWXYZ` (29 chars, no ambiguous 0/O/1/I/L/5/S)
- Format: `Q-` + 5 random chars from charset
- ~20M combinations
- Generate randomly, check collision in D1, retry up to 3 times

## API Contracts

### POST /api/public/quote (modified)
Request: QuoteEmailData (unchanged)
Response: `{ status: "ok", quoteId: "Q-XXXXX", email: { success, id } }`

### POST /api/public/booking (modified)
Request: BookingEmailData + optional `quoteId`
Response: `{ status: "ok", quoteId: "Q-XXXXX", email: { success, id } }`

### GET /api/public/quote/:quoteId (new)
Response: Quote data for pre-fill (excludes internal flags)
404 if not found or status is not 'quoted'

## New Files
- `worker/migrations/001_create_quotes.sql`
- `worker/src/services/database.ts`
- `worker/src/routes/get-quote.ts`
- `tests/database.test.js`

## Modified Files
- `worker/src/routes/quote.ts` — D1 insert + return quoteId
- `worker/src/routes/booking.ts` — D1 update/insert + return quoteId
- `worker/src/services/email.ts` — quoteId in templates, Book Now link
- `worker/src/index.ts` — register get-quote route
- `script.js` — URL param detection, pre-fill, quoteId in booking payload
- `CLAUDE.md` — document Phase 1B additions
