# Test Plan: Phase 1B — D1 Database + Quote ID + Book Now Pre-fill

## File: `tests/database.test.js`

### generateQuoteId()
- [ ] Returns string matching Q-XXXXX pattern (Q- + 5 chars)
- [ ] Only uses valid charset: 2346789ABCDEFGHJKMNPQRTUVWXYZ
- [ ] Does not contain ambiguous characters: 0, O, 1, I, L, 5, S
- [ ] Generates different IDs on successive calls (randomness)
- [ ] Retries on collision (mock D1 to return existing record on first attempt)
- [ ] Throws after max retries if all collide

### insertQuote(db, data)
- [ ] Inserts record with all quote fields
- [ ] Sets status to 'quoted'
- [ ] Sets created_at and updated_at to current ISO timestamp
- [ ] Returns the generated quote_id
- [ ] Stores service fields: service_display, box_size, delivery_zip, etc.
- [ ] Stores contact fields: first_name, last_name, email, phone
- [ ] Stores pricing fields: delivery_fee, first_month_rent, due_today, etc.
- [ ] Handles missing optional fields (company, how_heard, destination_zip)

### getQuoteByQuoteId(db, quoteId)
- [ ] Returns full quote record when found with status 'quoted'
- [ ] Returns null when quote_id does not exist
- [ ] Returns null when status is not 'quoted' (expired, cancelled, booked)
- [ ] Excludes internal flags from returned data (stella_forwarded, email_sent, sms_sent)

### updateQuoteToBooked(db, quoteId, bookingData)
- [ ] Updates status from 'quoted' to 'booked'
- [ ] Sets booked_at to current ISO timestamp
- [ ] Sets delivery_address, city, state, placement, surface_type
- [ ] Sets door_facing, gate_code, notes
- [ ] Updates updated_at timestamp
- [ ] Returns true on success
- [ ] Returns false when quoteId not found

### updateQuoteFlags(db, quoteId, flags)
- [ ] Updates email_sent flag to 1
- [ ] Updates stella_forwarded flag to 1
- [ ] Only updates specified flags (partial update)
- [ ] Updates updated_at timestamp

## File: `tests/get-quote-route.test.js`

### GET /api/public/quote/:quoteId
- [ ] Returns 200 with quote data for valid quoted record
- [ ] Returns quote fields needed for pre-fill (service, contact, pricing)
- [ ] Does NOT return internal fields (stella_forwarded, email_sent, id)
- [ ] Returns 404 when quoteId does not exist
- [ ] Returns 404 when quote status is 'booked'
- [ ] Returns 404 when quote status is 'expired'
- [ ] Validates quoteId format (Q-XXXXX pattern)
- [ ] Returns 400 for malformed quoteId

## File: `tests/quote-route-d1.test.js`

### POST /api/public/quote (with D1 integration)
- [ ] Returns 200 with quoteId in response
- [ ] quoteId matches Q-XXXXX format
- [ ] Inserts record into D1 quotes table
- [ ] Sends email with quoteId in template
- [ ] Forwards to Stella via waitUntil
- [ ] Updates D1 flags after email/stella operations
- [ ] Returns 207 on partial failure (email failed, stella forwarded)
- [ ] Returns 400 when email field is missing
- [ ] Returns 400 when email is invalid

## File: `tests/booking-route-d1.test.js`

### POST /api/public/booking (with quoteId)
- [ ] Updates existing quote to 'booked' when quoteId provided
- [ ] Creates new quote as 'booked' when no quoteId provided
- [ ] Returns quoteId in response
- [ ] Sets booked_at timestamp
- [ ] Adds Step 4 fields (address, placement, etc.)
- [ ] Sends booking confirmation email with quoteId
- [ ] Forwards to Stella via waitUntil
- [ ] Returns 400 when email is missing

## Email Template Changes

### buildQuoteConfirmationHtml (with quoteId)
- [ ] Displays quote number prominently: "Quote #Q-XXXXX"
- [ ] Includes "Book Now" button linking to houston.miboxhouston.com/?quoteId=Q-XXXXX
- [ ] Book Now button uses brand colors (yellow bg, dark text)
- [ ] CTA mentions quote number: "Reference Quote #Q-XXXXX"
- [ ] No blue colors anywhere
- [ ] Phone number is (713) 929-6051

### buildBookingConfirmationHtml (with quoteId)
- [ ] Shows "Booking Confirmed - Quote #Q-XXXXX"
- [ ] No "Book Now" button (already booked)
- [ ] CTA: "Reference Quote #Q-XXXXX when calling"
- [ ] Brand colors maintained

## Frontend Changes (script.js)

### URL parameter pre-fill
- [ ] Detects ?quoteId= parameter on page load
- [ ] Fetches GET /api/public/quote/:quoteId from Worker
- [ ] Pre-fills Step 1 fields (service type, container size, delivery ZIP, etc.)
- [ ] Pre-fills Step 2 fields (first name, email, phone)
- [ ] Pre-fills Step 3 pricing data
- [ ] Skips to Step 4 (booking form)
- [ ] Shows banner: "Welcome back! Your quote Q-XXXXX is ready."
- [ ] Shows error message if quoteId not found or expired
- [ ] Handles network errors gracefully

### Quote submission
- [ ] Stores quoteId from POST /api/public/quote response
- [ ] Includes quoteId in booking payload if available

## Existing tests (must still pass)
- [ ] All existing tests pass (npm test at root)
- [ ] TypeScript compilation: cd worker && npx tsc --noEmit
