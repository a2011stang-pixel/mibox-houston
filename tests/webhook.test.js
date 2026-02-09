import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildQuotePayload, buildBookingPayload, SERVICE_NAMES, STORAGE_LOCATION_NAMES } from '../lib.js';

const sampleQuoteData = {
  serviceType: 'onsite',
  containerSize: '16',
  deliveryZip: '77002',
  destinationZip: '',
  storageLocation: 'customer_property',
  deliveryDate: '2025-02-15',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '713-555-1234',
  howHeard: 'google',
  sms_consent: true,
  sms_consent_timestamp: '2025-01-15T10:00:00.000Z',
  deliveryFee: 79,
  firstMonthRent: 119,
  monthlyRent: 189,
  pickupFee: 79,
  dueToday: 198,
  ongoingMonthly: 189,
  dueWhenDone: 79,
  zone: 'zone1',
};

const sampleBookingData = {
  ...sampleQuoteData,
  deliveryAddress: '123 Main St',
  deliveryCity: 'Houston',
  deliveryState: 'TX',
  placementLocation: 'driveway',
  surfaceType: 'concrete',
  doorFacing: 'street',
  gateCode: '1234',
  specialNotes: 'Please call before delivery',
};

describe('buildQuotePayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets event_type to quote', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.event_type).toBe('quote');
  });

  it('includes customer contact fields', () => {
    const payload = buildQuotePayload(sampleQuoteData);

    expect(payload.customer_name).toBe('John');
    expect(payload.customer_last_name).toBe('Doe');
    expect(payload.customer_email).toBe('john@example.com');
    expect(payload.customer_phone).toBe('713-555-1234');
  });

  it('includes company field defaulting to empty string', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.company).toBe('');

    const withCompany = buildQuotePayload({ ...sampleQuoteData, company: 'Acme Corp' });
    expect(withCompany.company).toBe('Acme Corp');
  });

  it('maps service_type to human-readable names', () => {
    const onsitePayload = buildQuotePayload(sampleQuoteData);
    expect(onsitePayload.service_type).toBe('Storage (At Your Property)');

    const movingPayload = buildQuotePayload({ ...sampleQuoteData, serviceType: 'moving' });
    expect(movingPayload.service_type).toBe('Moving (To New Location)');

    const bothPayload = buildQuotePayload({ ...sampleQuoteData, serviceType: 'both' });
    expect(bothPayload.service_type).toBe('Storage + Moving');
  });

  it('maps container_size to 8x16 or 8x20', () => {
    const small = buildQuotePayload(sampleQuoteData);
    expect(small.container_size).toBe('8x16');

    const large = buildQuotePayload({ ...sampleQuoteData, containerSize: '20' });
    expect(large.container_size).toBe('8x20');
  });

  it('includes delivery_zip', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.delivery_zip).toBe('77002');
  });

  it('formats pricing fields as dollar amounts', () => {
    const payload = buildQuotePayload(sampleQuoteData);

    expect(payload.delivery_fee).toBe('$79.00');
    expect(payload.first_month_rent).toBe('$119.00');
    expect(payload.due_today).toBe('$198.00');
    expect(payload.monthly_rent).toBe('$189.00');
    expect(payload.ongoing_monthly).toBe('$189.00');
    expect(payload.pickup_fee).toBe('$79.00');
    expect(payload.due_when_done).toBe('$79.00');
  });

  it('includes timestamp', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.timestamp).toBe('2025-01-15T12:00:00.000Z');
  });

  it('includes source', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.source).toBe('miboxhouston.com');
  });

  it('includes turnstile token when provided', () => {
    const payload = buildQuotePayload(sampleQuoteData, 'abc123token');
    expect(payload.turnstileToken).toBe('abc123token');
  });

  it('has null turnstile token when not provided', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.turnstileToken).toBeNull();
  });

  it('does not include booking-specific fields', () => {
    const payload = buildQuotePayload(sampleQuoteData);
    expect(payload.delivery_address).toBeUndefined();
    expect(payload.delivery_city).toBeUndefined();
    expect(payload.delivery_date).toBeUndefined();
    expect(payload.placement_location).toBeUndefined();
  });

  it('defaults missing fields to empty strings', () => {
    const minimal = {
      deliveryFee: 79,
      firstMonthRent: 119,
      monthlyRent: 189,
      pickupFee: 79,
      dueToday: 198,
      ongoingMonthly: 189,
      dueWhenDone: 79,
    };
    const payload = buildQuotePayload(minimal);

    expect(payload.customer_name).toBe('');
    expect(payload.customer_last_name).toBe('');
    expect(payload.customer_email).toBe('');
    expect(payload.customer_phone).toBe('');
    expect(payload.company).toBe('');
    expect(payload.delivery_zip).toBe('');
    expect(payload.container_size).toBe('');
  });
});

describe('buildBookingPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets event_type to booking', () => {
    const payload = buildBookingPayload(sampleBookingData);
    expect(payload.event_type).toBe('booking');
  });

  it('includes all quote fields', () => {
    const payload = buildBookingPayload(sampleBookingData);

    expect(payload.customer_name).toBe('John');
    expect(payload.customer_last_name).toBe('Doe');
    expect(payload.customer_email).toBe('john@example.com');
    expect(payload.customer_phone).toBe('713-555-1234');
    expect(payload.service_type).toBe('Storage (At Your Property)');
    expect(payload.container_size).toBe('8x16');
    expect(payload.delivery_zip).toBe('77002');
    expect(payload.delivery_fee).toBe('$79.00');
    expect(payload.first_month_rent).toBe('$119.00');
    expect(payload.due_today).toBe('$198.00');
    expect(payload.monthly_rent).toBe('$189.00');
    expect(payload.ongoing_monthly).toBe('$189.00');
    expect(payload.pickup_fee).toBe('$79.00');
    expect(payload.due_when_done).toBe('$79.00');
  });

  it('includes booking-specific fields', () => {
    const payload = buildBookingPayload(sampleBookingData);

    expect(payload.delivery_address).toBe('123 Main St');
    expect(payload.delivery_city).toBe('Houston');
    expect(payload.delivery_state).toBe('TX');
    expect(payload.delivery_date).toBe('2025-02-15');
    expect(payload.placement_location).toBe('driveway');
    expect(payload.surface_type).toBe('concrete');
    expect(payload.door_facing).toBe('street');
    expect(payload.gate_code).toBe('1234');
    expect(payload.special_notes).toBe('Please call before delivery');
  });

  it('defaults missing booking fields to empty strings', () => {
    const payload = buildBookingPayload(sampleQuoteData);

    expect(payload.delivery_address).toBe('');
    expect(payload.delivery_city).toBe('');
    expect(payload.delivery_state).toBe('');
    expect(payload.delivery_date).toBe('2025-02-15'); // comes from quote step data
    expect(payload.placement_location).toBe('');
    expect(payload.surface_type).toBe('');
    expect(payload.door_facing).toBe('');
    expect(payload.gate_code).toBe('');
    expect(payload.special_notes).toBe('');
  });

  it('includes timestamp and source', () => {
    const payload = buildBookingPayload(sampleBookingData);
    expect(payload.timestamp).toBe('2025-01-15T12:00:00.000Z');
    expect(payload.source).toBe('miboxhouston.com');
  });

  it('includes turnstile token when provided', () => {
    const payload = buildBookingPayload(sampleBookingData, 'abc123token');
    expect(payload.turnstileToken).toBe('abc123token');
  });
});

describe('SERVICE_NAMES', () => {
  it('has correct display name for onsite service', () => {
    expect(SERVICE_NAMES.onsite).toBe('Storage (At Your Property)');
  });

  it('has correct display name for moving service', () => {
    expect(SERVICE_NAMES.moving).toBe('Moving (To New Location)');
  });

  it('has correct display name for both service', () => {
    expect(SERVICE_NAMES.both).toBe('Storage + Moving');
  });
});

describe('STORAGE_LOCATION_NAMES', () => {
  it('has correct display name for customer property storage', () => {
    expect(STORAGE_LOCATION_NAMES.customer_property).toBe('At My Property');
  });

  it('has correct display name for secured facility storage', () => {
    expect(STORAGE_LOCATION_NAMES.secured_facility).toBe('At Our Secured Facility (Outside Storage Only)');
  });
});
