import { describe, it, expect } from 'vitest';
import {
  buildQuoteConfirmationHtml,
  buildBookingConfirmationHtml,
} from '../worker/src/services/email.ts';

const sampleQuoteData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-1234',
  serviceDisplay: 'Storage - At My Property',
  boxSize: '8x16',
  deliveryZip: '77002',
  deliveryDate: '2026-03-15',
  deliveryFee: '$79.00',
  firstMonthRent: '$119.00',
  monthlyRent: '$189.00',
  dueToday: '$198.00',
  ongoingMonthly: '$189.00',
  leadSource: 'Website',
  formType: 'quote',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const sampleBookingData = {
  ...sampleQuoteData,
  formType: 'booking',
  deliveryAddress: '123 Main St',
  city: 'Houston',
  state: 'TX',
  placement: 'Driveway',
  surfaceType: 'Concrete',
  doorFacing: 'Street',
};

// ===== Company Name / Header =====
describe('Header branding', () => {
  it('shows "MI-BOX Moving & Mobile Storage" in header (quote)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('MI-BOX Moving &amp; Mobile Storage');
  });

  it('shows "of Houston" in header (quote)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('>of Houston<');
  });

  it('header company name is in yellow (#FFDD00)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toMatch(/color:#FFDD00[^>]*>MI-BOX Moving/);
  });

  it('header "of Houston" is in gray (#cccccc)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toMatch(/color:#cccccc[^>]*>of Houston/);
  });

  it('shows "MI-BOX Moving & Mobile Storage" in header (booking)', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('MI-BOX Moving &amp; Mobile Storage');
  });
});

// ===== Footer =====
describe('Footer branding', () => {
  it('footer shows updated company name', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('MI-BOX Moving &amp; Mobile Storage of Houston');
  });

  it('quote validity is 10 days (not 30)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('10 days');
    expect(html).not.toContain('30 days');
  });

  it('booking footer also shows 10 days', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('10 days');
    expect(html).not.toContain('30 days');
  });
});

// ===== Trust Bar =====
describe('Trust bar', () => {
  it('contains "Google Reviews" text', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Google Reviews');
  });

  it('contains 5.0 rating', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('5.0');
  });

  it('contains unicode stars in yellow', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('&#9733;');
    expect(html).toMatch(/color:#FFDD00[^>]*>&#9733;/);
  });

  it('contains "Locally Owned" text', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Locally Owned');
  });

  it('contains "Operated in Houston, TX"', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Operated in Houston, TX');
  });

  it('trust bar present in booking email too', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('Google Reviews');
    expect(html).toContain('Locally Owned');
  });
});

// ===== Quote Confirmation CTA =====
describe('Quote confirmation CTA', () => {
  it('displays quote number when quoteId provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Quote #Q-ABC23');
  });

  it('includes Book Now button when quoteId provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Book Now');
    expect(html).toContain('houston.miboxhouston.com/?quoteId=Q-ABC23');
  });

  it('Book Now button uses brand yellow background', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('background-color:#FFDD00');
  });

  it('Book Now button has dark text', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    // The button anchor should have dark text color
    expect(html).toMatch(/Book Now<\/a>/);
    expect(html).toMatch(/color:#333333[^>]*>Book Now/);
  });

  it('"Or call (713) 929-6051" appears below Book Now button', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Or call');
    expect(html).toContain('(713) 929-6051');
    // The "Or call" text should come after the Book Now button
    const bookNowIdx = html.indexOf('Book Now');
    const orCallIdx = html.indexOf('Or call');
    expect(orCallIdx).toBeGreaterThan(bookNowIdx);
  });

  it('phone number is clickable tel: link', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('href="tel:7139296051"');
  });

  it('does not include quote banner when quoteId not provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData);
    expect(html).not.toContain('Quote #');
    expect(html).not.toContain('Book Now');
  });

  it('does not include Book Now button when quoteId not provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData);
    expect(html).not.toContain('quoteId=');
  });
});

// ===== Booking Confirmation CTA =====
describe('Booking confirmation CTA', () => {
  it('shows booking confirmed with quote number', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('Booking Confirmed - Quote #Q-XY789');
  });

  it('does not include Book Now button (already booked)', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).not.toContain('Book Now');
    expect(html).not.toContain('quoteId=');
  });

  it('shows "Questions? Call (713) 929-6051 and reference Quote #"', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('Questions?');
    expect(html).toContain('(713) 929-6051');
    expect(html).toContain('reference Quote #Q-XY789');
  });

  it('does not include booking banner when quoteId not provided', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData);
    expect(html).not.toContain('Booking Confirmed - Quote #');
  });

  it('uses brand colors', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('#FFDD00');
    expect(html).toContain('#333333');
  });

  it('phone number is (713) 929-6051', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('(713) 929-6051');
  });
});

// ===== Legal Disclaimer =====
describe('Legal disclaimer', () => {
  it('contains disclaimer text in quote email', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Pricing is based on the information provided');
    expect(html).toContain('subject to change without notice');
    expect(html).toContain('Sales tax is not included');
  });

  it('contains disclaimer text in booking email', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('Pricing is based on the information provided');
  });

  it('disclaimer uses small gray text (11px, #888888)', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toMatch(/color:#888888[^>]*font-size:11px/);
  });

  it('disclaimer mentions company name', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('MI-BOX Moving &amp; Mobile Storage of Houston reserves the right');
  });
});

// ===== No Blue Colors =====
describe('No blue colors', () => {
  it('quote email has no #007ABD', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).not.toContain('#007ABD');
  });

  it('quote email has no #0056A6', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).not.toContain('#0056A6');
  });

  it('booking email has no #007ABD', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).not.toContain('#007ABD');
  });

  it('booking email has no #0056A6', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).not.toContain('#0056A6');
  });
});

// ===== No Emojis =====
describe('No emojis', () => {
  it('quote email contains no emoji characters', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    // Match common emoji ranges (emoji are above U+1F000 and various other ranges)
    // eslint-disable-next-line no-misleading-character-class
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });

  it('booking email contains no emoji characters', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    // eslint-disable-next-line no-misleading-character-class
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});

// ===== XSS Prevention =====
describe('XSS prevention', () => {
  it('escapes quoteId to prevent XSS', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-<script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
