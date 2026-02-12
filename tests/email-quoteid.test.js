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

describe('buildQuoteConfirmationHtml with quoteId', () => {
  it('displays quote number when quoteId provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Quote #Q-ABC23');
  });

  it('includes Book Now button when quoteId provided', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('Book Now');
    expect(html).toContain('houston.miboxhouston.com/?quoteId=Q-ABC23');
  });

  it('Book Now button uses brand colors', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('background-color:#FFDD00');
    expect(html).toContain('color:#333333');
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

  it('phone number is (713) 929-6051', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).toContain('(713) 929-6051');
  });

  it('does not contain any blue colors', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-ABC23');
    expect(html).not.toContain('#007ABD');
    expect(html).not.toContain('#0056A6');
  });

  it('escapes quoteId to prevent XSS', () => {
    const html = buildQuoteConfirmationHtml(sampleQuoteData, 'Q-<script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('buildBookingConfirmationHtml with quoteId', () => {
  it('shows booking confirmed with quote number', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).toContain('Booking Confirmed - Quote #Q-XY789');
  });

  it('does not include Book Now button (already booked)', () => {
    const html = buildBookingConfirmationHtml(sampleBookingData, 'Q-XY789');
    expect(html).not.toContain('Book Now');
    expect(html).not.toContain('quoteId=');
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
