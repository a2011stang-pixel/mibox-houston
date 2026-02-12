# Project Rules for Claude

## AI Digital Engineer Workflow

Follow this 9-step workflow for all feature development. Each step has a corresponding hook or gate that enforces completion before proceeding.

### Step 1: Design
- Create a design canvas (architecture, data flow, API contracts)
- **Hook**: `check-design-canvas.sh` (PreToolUse) blocks code changes without a design

### Step 2: Test Plan
- Document test cases before writing implementation code
- **Hook**: `check-test-plan.sh` (PreToolUse on Write|Edit) blocks code changes without a test plan

### Step 3: Implement
- Write code following TDD — tests first, then implementation
- Follow OWASP security practices (see below)

### Step 4: Unit Tests
- Run `npm test` and verify all tests pass with zero failures
- Run `npm run test:coverage` to verify coverage requirements
- **Hook**: `check-unit-tests.sh` (PreToolUse on Bash) blocks commits with failing tests

### Step 5: PR Creation
- Code-simplify review before committing (`check-code-simplifier.sh`)
- PR review check before pushing (`check-pr-review.sh`)
- Create PR via feature branch → main

### Step 6: CI Verification
- GitHub Actions runs tests + Snyk security scan on push
- **Hook**: `verify-completion.sh` (Stop) blocks task completion until CI passes
- Also runs local typecheck (`tsc --noEmit`) and ESLint before checking CI

### Step 7: Preview Deploy
- Cloudflare Pages deploys a preview for the PR branch
- Verify the preview URL loads correctly

### Step 8: E2E Check
- Run E2E tests on the preview environment
- Mark complete: `.claude/hooks/state-manager.sh mark e2e-tests`
- **Hook**: `verify-completion.sh` (Stop) blocks task completion without E2E verification

### Step 9: Merge
- Ensure all review comments are resolved
- **Hook**: `verify-completion.sh` (Stop) blocks completion with unresolved review threads
- Merge PR and verify production deploy

## State Management

State is tracked in `.claude/state/` via `state-manager.sh`:

```bash
.claude/hooks/state-manager.sh mark <action>     # Mark step completed
.claude/hooks/state-manager.sh check <action>    # Check if step completed
.claude/hooks/state-manager.sh clear-all         # Reset for new task
.claude/hooks/state-manager.sh list              # Show current states
```

Actions: `design-canvas`, `test-plan`, `code-simplifier`, `pr-review`, `unit-tests`, `e2e-tests`

State files expire after 30 minutes and are tied to the current git HEAD.

## Resume Capability

If resuming work from a previous session, check `.claude/state/` for completed steps and continue from where you left off.

## Hooks Reference

All hooks live in `.claude/hooks/` and are configured in `.claude/settings.json`. Paths use `$CLAUDE_PROJECT_DIR` for portability.

| Hook | Event | Purpose |
|------|-------|---------|
| `check-test-plan.sh` | PreToolUse (Write\|Edit) | Blocks code changes without a test plan |
| `check-unit-tests.sh` | PreToolUse (Bash) | Blocks commits with failing tests |
| `check-design-canvas.sh` | PreToolUse | Blocks code without design canvas |
| `check-code-simplifier.sh` | PreToolUse | Ensures code simplification before commit |
| `check-pr-review.sh` | PreToolUse | Ensures PR review before push |
| `verify-completion.sh` | Stop | Blocks completion until CI + E2E + reviews pass; runs typecheck and lint |
| `post-file-edit-reminder.sh` | PostToolUse | Reminds to run tests after edits |
| `post-git-action-clear.sh` | PostToolUse | Clears state after git operations |
| `post-git-push.sh` | PostToolUse | Post-push notifications |
| `warn-skip-verification.sh` | PreToolUse | Warns if trying to skip verification |
| `state-manager.sh` | Utility | Tracks workflow step completion |
| `lib.sh` | Utility | Shared functions for hook scripts |

## Before Committing

1. **Always run `npm test`** before committing any changes
2. Ensure all tests pass with zero failures
3. Run `npm run test:coverage` to verify coverage requirements

## Code Coverage Requirements

- **lib.js must maintain 100% coverage** on statements, branches, functions, and lines
- When adding new functions to lib.js, add corresponding tests
- Security-related functions require security-focused test cases

## Security Practices (OWASP)

Follow OWASP security guidelines when writing or modifying code:

### Input Validation
- Validate all user inputs on both client and server side
- Use allowlist validation for ZIP codes (only accept known valid values)
- Reject malformed email addresses via regex validation
- Sanitize inputs before displaying in DOM to prevent XSS

### Injection Prevention
- Never construct SQL queries with user input (this is a static site, but applies to any backend)
- Validate ZIP codes against known allowlist - do not accept arbitrary input
- Escape special characters when building HTML or JSON

### Data Protection
- Never log sensitive user data (emails, phone numbers, addresses)
- Use HTTPS for all webhook submissions
- Include Turnstile/CAPTCHA tokens to prevent automated abuse

### Webhook Security
- Server-controlled fields (`timestamp`, `source`, `formType`, `turnstileToken`) must override any user-supplied values
- Format and validate all pricing data server-side before processing
- Implement rate limiting on webhook endpoints (server-side)

### Code Review Checklist
- [ ] No hardcoded secrets or API keys
- [ ] XSS payloads are handled safely (escaped or rejected)
- [ ] SQL injection attempts are rejected by validation
- [ ] Negative/invalid price values are handled appropriately
- [ ] Unicode and special characters don't break functionality

## Testing Commands

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Project Structure

### Frontend (Static Site)
- `script.js` - Browser-facing code with DOM interactions
- `lib.js` - Testable business logic (pricing, validation, webhook payloads)
- `src/email/quote-confirmation.js` - Resend email module (Phase 1a standalone)
- `tests/` - Vitest test files
  - `pricing.test.js` - Quote calculation and zone detection
  - `validation.test.js` - Form field validation
  - `webhook.test.js` - Webhook payload construction
  - `formatting.test.js` - Currency and date formatting
  - `security.test.js` - XSS, SQL injection, tampering prevention
  - `quote-email.test.js` - Quote confirmation email tests

### Backend (Cloudflare Worker)
- `worker/src/index.ts` - Hono app entry point with scheduled handler
- `worker/src/types.ts` - TypeScript interfaces (Env, User, Zone, Pricing, etc.)
- `worker/src/middleware/auth.ts` - JWT + session auth middleware
- `worker/src/routes/` - API route handlers
  - `auth.ts` - Login, TOTP MFA, logout
  - `zones.ts` - Zone CRUD (protected)
  - `zips.ts` - ZIP code management (protected)
  - `pricing.ts` - Pricing CRUD (protected)
  - `audit.ts` - Audit log queries (protected)
  - `admin.ts` - Backup management and restore (protected)
  - `public.ts` - Public pricing/zone lookup endpoints
  - `quote.ts` - POST /api/public/quote (D1 insert + Resend email + Stella CRM)
  - `booking.ts` - POST /api/public/booking (D1 update/insert + Resend email + Stella CRM)
  - `get-quote.ts` - GET /api/public/quote/:quoteId (fetch quote for pre-fill)
- `worker/src/services/` - Business logic
  - `auth.ts` - Authentication and session service
  - `audit.ts` - Immutable audit logging
  - `backup.ts` - D1-to-R2 backup, restore, and cleanup
  - `totp.ts` - TOTP/MFA service
  - `email.ts` - Resend email service (quote + booking templates, Stella forwarding)
  - `database.ts` - Quote ID generation, D1 CRUD for quotes table
- `worker/src/utils/crypto.ts` - JWT and crypto utilities
- `worker/wrangler.toml` - Cloudflare Worker config (D1, R2, cron)
- `worker/schema.sql` - D1 database schema (admin tables)
- `worker/migrations/001_create_quotes.sql` - Quotes table migration

### D1-to-R2 Backup System
- **Cron**: `0 8 * * *` (2AM Central / 8AM UTC) runs nightly
- **Tables backed up**: zones, zip_codes, pricing, users (excluding password_hash/totp_secret), audit_log
- **R2 layout**: `backups/YYYY-MM-DD/tablename.json` + `manifest.json`
- **Retention**: 14 days, auto-cleanup after each backup
- **Restore**: POST `/api/admin/restore` — only zones, zip_codes, pricing (atomic via D1 batch)
- **Manual trigger**: POST `/api/admin/backups/trigger` (auth required)
- **List backups**: GET `/api/admin/backups`

### Quote System (Phase 1B)
- **Table**: `quotes` in mibox-houston D1 database
- **Quote ID format**: `Q-XXXXX` (charset: `2346789ABCDEFGHJKMNPQRTUVWXYZ`, no ambiguous chars)
- **Status flow**: `quoted` → `booked` (or `expired` / `cancelled`)
- **POST /api/public/quote**: Generates quote ID, inserts into D1, sends email, forwards to Stella
- **POST /api/public/booking**: Updates existing quote to booked (or creates new), sends email
- **GET /api/public/quote/:quoteId**: Returns quote data for frontend pre-fill (only status=quoted)
- **Book Now link**: `https://miboxhouston.com/?quoteId=Q-XXXXX`
- **Frontend pre-fill**: Detects `?quoteId=` param, fetches quote data, skips to Step 4
- **Migration**: `worker/migrations/001_create_quotes.sql`

### Deploy Commands

```bash
cd worker && npx wrangler deploy -c wrangler.toml   # Deploy worker (requires -c flag for wrangler 4.x)
cd worker && npx tsc --noEmit                         # Typecheck worker
```

## Email Template Standards

All email templates (quote confirmations, booking confirmations, future transactional emails) MUST follow these rules.

### Brand Colors
- **MI-BOX Yellow**: `#FFDD00` — primary accent, CTA buttons, section headers
- **MI-BOX Dark/Black**: `#333333` — body text, dark backgrounds (header, footer)
- **Gray**: `#f8f9fa` — section backgrounds, quote detail boxes
- **Muted text**: `#666666` — secondary/caption text
- **White**: `#ffffff` — email body background
- **Footer text on dark**: `#cccccc`

The brand is yellow, black, and gray. Do NOT use blue (`#007ABD`, `#0056A6`, or any other blue) in email templates.

### Email Rules — ALWAYS follow these:
1. **No emojis** — never use emoji in subject lines, body text, or CTAs
2. **Brand colors only** — yellow, black/dark, gray, white. No blue.
3. **Font stack**: Arial, Helvetica, sans-serif (email-safe)
4. **CTA button**: MI-BOX Yellow (`#FFDD00`) background, dark (`#333333`) text, bold, 6px border-radius
5. **Phone number**: (713) 929-6051 with `tel:7139296051` — this is the only phone number to use
6. **From address**: `MI-BOX Houston <sales@miboxhouston.com>`
7. **Header**: Dark background (`#333333`) with "MI-BOX Moving & Mobile Storage" in MI-BOX Yellow (`#FFDD00`), "of Houston" in `#cccccc`
8. **Footer**: Dark background (`#333333`), white/light text, company name, "MI-BOX Moving & Mobile Storage of Houston", 10-day quote validity
9. **Table-based layout only** — no CSS grid, no flexbox (email client compatibility)
10. **All styles inline** — no external stylesheets, no `<style>` blocks
11. **Max width**: 600px centered
12. **Tone**: Professional, friendly, concise. No exclamation marks in subject lines.
13. **XSS prevention**: All user-provided values MUST be HTML-escaped via `escapeHtml()`

### Template Files
- `src/email/quote-confirmation.js` — Phase 1a standalone module (snake_case fields)
- `worker/src/services/email.ts` — Worker email service (camelCase fields)
- Both files must stay in sync on branding, colors, and phone number
