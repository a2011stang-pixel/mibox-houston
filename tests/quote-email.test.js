import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildQuoteConfirmationEmail,
  sendQuoteConfirmation,
  escapeHtml,
} from '../src/email/quote-confirmation.js';

const baseQuoteData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  box_size: '8x16',
  delivery_zip: '77002',
  delivery_date: '2025-02-15',
  delivery_price: '$79.00',
  first_month_rent: '$119.00',
  monthly_rent: '$189.00',
  due_today: '$198.00',
  ongoing_monthly: '$189.00',
  service_display: 'Storage - At My Property',
};

describe('escapeHtml', () => {
  it('escapes & to &amp;', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes < to &lt;', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes > to &gt;', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes " to &quot;', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it("escapes ' to &#39;", () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns empty string for null input', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('buildQuoteConfirmationEmail', () => {
  it('includes customer first name in greeting', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('John');
  });

  it('includes container size', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('8x16');
  });

  it('includes delivery ZIP code', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('77002');
  });

  it('includes delivery date', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('2025-02-15');
  });

  it('includes delivery price', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('$79.00');
  });

  it('includes first month rent', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('$119.00');
  });

  it('includes monthly rent', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('$189.00');
  });

  it('includes due today total', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('$198.00');
  });

  it('includes ongoing monthly amount', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('$189.00');
  });

  it('includes service type display name', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('Storage - At My Property');
  });

  it('contains MI-BOX Houston branding', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('MI-BOX Houston');
  });

  it('contains brand color', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('#0056A6');
  });

  it('returns valid HTML structure', () => {
    const html = buildQuoteConfirmationEmail(baseQuoteData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('</html>');
  });

  it('HTML-escapes customer name containing script tags', () => {
    const data = { ...baseQuoteData, first_name: '<script>alert("xss")</script>' };
    const html = buildQuoteConfirmationEmail(data);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('HTML-escapes special characters in name', () => {
    const data = { ...baseQuoteData, first_name: 'O\'Brien & "Friends"' };
    const html = buildQuoteConfirmationEmail(data);
    expect(html).toContain('O&#39;Brien &amp; &quot;Friends&quot;');
  });

  it('handles unicode/emoji in customer name', () => {
    const data = { ...baseQuoteData, first_name: 'José 🏠' };
    const html = buildQuoteConfirmationEmail(data);
    expect(html).toContain('José 🏠');
  });

  it('handles missing optional fields with defaults', () => {
    const data = { ...baseQuoteData };
    delete data.delivery_date;
    delete data.service_display;
    const html = buildQuoteConfirmationEmail(data);
    expect(html).toContain('John');
    expect(html).toBeDefined();
  });
});

describe('sendQuoteConfirmation', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('calls fetch with correct URL', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.any(Object)
    );
  });

  it('uses POST method', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.method).toBe('POST');
  });

  it('sends Authorization header with Bearer token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Authorization']).toBe('Bearer re_test_key');
  });

  it('sends Content-Type application/json', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Content-Type']).toBe('application/json');
  });

  it('sends correct from address', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toBe('MI-BOX Houston <sales@miboxhouston.com>');
  });

  it('sends to customer email from quoteData', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.to).toEqual(['john@example.com']);
  });

  it('sends correct subject line', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.subject).toBe('Your MI-BOX Houston Quote');
  });

  it('sends HTML body from buildQuoteConfirmationEmail', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.html).toContain('<!DOCTYPE html>');
    expect(body.html).toContain('MI-BOX Houston');
    expect(body.html).toContain('John');
  });

  it('returns success with email id on 200 response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'email_123' }),
    });
    const result = await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    expect(result).toEqual({ success: true, id: 'email_123' });
  });

  it('returns error when email is missing', async () => {
    const data = { ...baseQuoteData };
    delete data.email;
    const result = await sendQuoteConfirmation(data, 're_test_key');
    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error when email is invalid format', async () => {
    const data = { ...baseQuoteData, email: 'not-an-email' };
    const result = await sendQuoteConfirmation(data, 're_test_key');
    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error when apiKey is missing', async () => {
    const result = await sendQuoteConfirmation(baseQuoteData, '');
    expect(result.success).toBe(false);
    expect(result.error).toContain('API key');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error on non-200 response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: 'Invalid from address' }),
    });
    const result = await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error on network/fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('never throws exceptions — always returns result object', async () => {
    global.fetch.mockRejectedValueOnce(new Error('catastrophic failure'));
    const result = await sendQuoteConfirmation(baseQuoteData, 're_test_key');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('error');
  });
});
