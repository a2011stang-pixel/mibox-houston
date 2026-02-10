# Project Rules for Claude

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

- `script.js` - Browser-facing code with DOM interactions
- `lib.js` - Testable business logic (pricing, validation, webhook payloads)
- `tests/` - Vitest test files
  - `pricing.test.js` - Quote calculation and zone detection
  - `validation.test.js` - Form field validation
  - `webhook.test.js` - Webhook payload construction
  - `formatting.test.js` - Currency and date formatting
  - `security.test.js` - XSS, SQL injection, tampering prevention

## Development Workflow (AI Digital Engineer)
Follow this structured workflow for all feature development:
1. Test Plan - Document test cases before implementation
2. Implementation - Write code following TDD
3. Unit Tests - Verify all tests pass (npm test)
4. Commit - Only after tests pass
5. Push - Triggers CI (GitHub Actions runs tests + Snyk security scan)
6. Verify CI - Do not consider task complete until CI passes

## Hooks Enforcement
- PreToolUse hooks block code changes without test plans
- PreToolUse hooks block commits with failing tests
- Stop hooks block task completion without CI passing
- State is tracked in .claude/state/ for resume capability

## Resume Capability
If resuming work from a previous session, check .claude/state/ for completed steps and continue from where you left off.
