import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildWebhookPayload, SERVICE_NAMES, STORAGE_LOCATION_NAMES } from '../lib.js';

describe('buildWebhookPayload', () => {
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

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes all quote data fields', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.serviceType).toBe('onsite');
    expect(payload.containerSize).toBe('16');
    expect(payload.deliveryZip).toBe('77002');
    expect(payload.storageLocation).toBe('customer_property');
    expect(payload.firstName).toBe('John');
    expect(payload.lastName).toBe('Doe');
    expect(payload.email).toBe('john@example.com');
    expect(payload.phone).toBe('713-555-1234');
  });

  it('includes explicitly named quote step fields', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.customer_name).toBe('John');
    expect(payload.customer_last_name).toBe('Doe');
    expect(payload.customer_email).toBe('john@example.com');
    expect(payload.customer_phone).toBe('713-555-1234');
    expect(payload.service_type).toBe('Storage (At Your Property)');
    expect(payload.container_size).toBe('8x16');
    expect(payload.delivery_zip).toBe('77002');
    expect(payload.delivery_date).toBe('2025-02-15');
  });

  it('maps container_size to 8x20 for 20ft containers', () => {
    const payload = buildWebhookPayload({ ...sampleQuoteData, containerSize: '20' }, 'quote');
    expect(payload.container_size).toBe('8x20');
  });

  it('maps service_type to human-readable names', () => {
    const movingPayload = buildWebhookPayload({ ...sampleQuoteData, serviceType: 'moving' }, 'quote');
    expect(movingPayload.service_type).toBe('Moving (To New Location)');

    const bothPayload = buildWebhookPayload({ ...sampleQuoteData, serviceType: 'both' }, 'quote');
    expect(bothPayload.service_type).toBe('Storage + Moving');
  });

  it('includes company field defaulting to empty string', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');
    expect(payload.company).toBe('');

    const withCompany = buildWebhookPayload({ ...sampleQuoteData, company: 'Acme Corp' }, 'quote');
    expect(withCompany.company).toBe('Acme Corp');
  });

  it('includes storage location for onsite service', () => {
    const payload = buildWebhookPayload({
      ...sampleQuoteData,
      storageLocation: 'secured_facility',
    }, 'quote');

    expect(payload.storageLocation).toBe('secured_facility');
  });

  it('formats pricing fields as dollar amounts', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.deliveryFee).toBe('$79.00');
    expect(payload.firstMonthRent).toBe('$119.00');
    expect(payload.monthlyRent).toBe('$189.00');
    expect(payload.pickupFee).toBe('$79.00');
    expect(payload.dueToday).toBe('$198.00');
    expect(payload.ongoingMonthly).toBe('$189.00');
    expect(payload.dueWhenDone).toBe('$79.00');
  });

  it('includes form type', () => {
    const quotePayload = buildWebhookPayload(sampleQuoteData, 'quote');
    expect(quotePayload.formType).toBe('quote');

    const bookingPayload = buildWebhookPayload(sampleQuoteData, 'booking');
    expect(bookingPayload.formType).toBe('booking');
  });

  it('includes timestamp', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.timestamp).toBe('2025-01-15T12:00:00.000Z');
  });

  it('includes source', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.source).toBe('miboxhouston.com');
  });

  it('includes turnstile token when provided', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote', 'abc123token');

    expect(payload.turnstileToken).toBe('abc123token');
  });

  it('has null turnstile token when not provided', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.turnstileToken).toBeNull();
  });

  it('includes SMS consent data', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.sms_consent).toBe(true);
    expect(payload.sms_consent_timestamp).toBe('2025-01-15T10:00:00.000Z');
  });

  it('preserves zone information', () => {
    const payload = buildWebhookPayload(sampleQuoteData, 'quote');

    expect(payload.zone).toBe('zone1');
  });

  describe('with booking data', () => {
    const bookingData = {
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

    it('includes delivery address details', () => {
      const payload = buildWebhookPayload(bookingData, 'booking');

      expect(payload.deliveryAddress).toBe('123 Main St');
      expect(payload.deliveryCity).toBe('Houston');
      expect(payload.deliveryState).toBe('TX');
    });

    it('includes placement details', () => {
      const payload = buildWebhookPayload(bookingData, 'booking');

      expect(payload.placementLocation).toBe('driveway');
      expect(payload.surfaceType).toBe('concrete');
      expect(payload.doorFacing).toBe('street');
    });

    it('includes optional fields', () => {
      const payload = buildWebhookPayload(bookingData, 'booking');

      expect(payload.gateCode).toBe('1234');
      expect(payload.specialNotes).toBe('Please call before delivery');
    });
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
