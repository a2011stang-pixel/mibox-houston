import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isValidEmail,
  isDateInPast,
  validateStep1Fields,
  validateStep2Fields,
  validateStep4Fields,
} from '../lib.js';

describe('isValidEmail', () => {
  it('returns true for valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
  });

  it('returns false for invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('no@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isDateInPast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for dates in the past', () => {
    expect(isDateInPast('2025-01-14')).toBe(true);
    expect(isDateInPast('2024-12-31')).toBe(true);
    expect(isDateInPast('2020-01-01')).toBe(true);
  });

  it('returns true for today (delivery must be tomorrow or later)', () => {
    expect(isDateInPast('2025-01-15')).toBe(true);
  });

  it('returns false for future dates', () => {
    expect(isDateInPast('2025-01-16')).toBe(false);
    expect(isDateInPast('2025-02-01')).toBe(false);
    expect(isDateInPast('2026-01-01')).toBe(false);
  });

  it('returns false for empty/null dates', () => {
    expect(isDateInPast('')).toBe(false);
    expect(isDateInPast(null)).toBe(false);
    expect(isDateInPast(undefined)).toBe(false);
  });
});

describe('validateStep1Fields', () => {
  // Use a date far in the future to avoid timezone/date issues
  const validStep1Data = {
    serviceType: 'onsite',
    deliveryZip: '77002',
    containerSize: '16',
    deliveryDate: '2030-12-01',
    destinationZip: '',
  };

  it('returns no errors for valid onsite service data', () => {
    const errors = validateStep1Fields(validStep1Data);
    expect(errors).toHaveLength(0);
  });

  it('returns error when service type is missing', () => {
    const errors = validateStep1Fields({ ...validStep1Data, serviceType: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'serviceType' })
    );
  });

  it('returns error when delivery ZIP is missing', () => {
    const errors = validateStep1Fields({ ...validStep1Data, deliveryZip: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'deliveryZip' })
    );
  });

  it('returns error for unsupported delivery ZIP', () => {
    const errors = validateStep1Fields({ ...validStep1Data, deliveryZip: '90210' });
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'deliveryZip',
        message: expect.stringContaining('do not currently serve'),
      })
    );
  });

  it('returns error when container size is missing', () => {
    const errors = validateStep1Fields({ ...validStep1Data, containerSize: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'containerSize' })
    );
  });

  it('returns error when delivery date is missing', () => {
    const errors = validateStep1Fields({ ...validStep1Data, deliveryDate: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'deliveryDate' })
    );
  });

  it('returns error for past delivery date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));

    const errors = validateStep1Fields({ ...validStep1Data, deliveryDate: '2025-01-14' });
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'deliveryDate',
        message: expect.stringContaining('tomorrow'),
      })
    );

    vi.useRealTimers();
  });

  describe('moving service validation', () => {
    it('requires destination ZIP for moving service', () => {
      const errors = validateStep1Fields({
        ...validStep1Data,
        serviceType: 'moving',
        destinationZip: '',
      });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'destinationZip' })
      );
    });

    it('returns error for unsupported destination ZIP', () => {
      const errors = validateStep1Fields({
        ...validStep1Data,
        serviceType: 'moving',
        destinationZip: '90210',
      });
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'destinationZip',
          message: expect.stringContaining('destination ZIP'),
        })
      );
    });

    it('accepts valid destination ZIP for moving service', () => {
      const errors = validateStep1Fields({
        ...validStep1Data,
        serviceType: 'moving',
        destinationZip: '77301',
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('storage + moving (both) service validation', () => {
    it('requires destination ZIP for both service', () => {
      const errors = validateStep1Fields({
        ...validStep1Data,
        serviceType: 'both',
        destinationZip: '',
      });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'destinationZip' })
      );
    });

    it('accepts valid destination ZIP for both service', () => {
      const errors = validateStep1Fields({
        ...validStep1Data,
        serviceType: 'both',
        destinationZip: '77002',
      });
      expect(errors).toHaveLength(0);
    });
  });
});

describe('validateStep2Fields', () => {
  const validStep2Data = {
    firstName: 'John',
    email: 'john@example.com',
    phone: '713-555-1234',
    smsConsent: true,
  };

  it('returns no errors for valid data', () => {
    const errors = validateStep2Fields(validStep2Data);
    expect(errors).toHaveLength(0);
  });

  it('returns error when first name is missing', () => {
    const errors = validateStep2Fields({ ...validStep2Data, firstName: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'firstName' })
    );
  });

  it('returns error when email is missing', () => {
    const errors = validateStep2Fields({ ...validStep2Data, email: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'email' })
    );
  });

  it('returns error for invalid email format', () => {
    const errors = validateStep2Fields({ ...validStep2Data, email: 'invalid-email' });
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: 'email',
        message: expect.stringContaining('valid email'),
      })
    );
  });

  it('returns error when phone is missing', () => {
    const errors = validateStep2Fields({ ...validStep2Data, phone: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'phone' })
    );
  });

  it('returns error when SMS consent is not given with phone', () => {
    const errors = validateStep2Fields({ ...validStep2Data, smsConsent: false });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'smsConsent' })
    );
  });

  it('does not require SMS consent if phone is empty', () => {
    const errors = validateStep2Fields({
      firstName: 'John',
      email: 'john@example.com',
      phone: '',
      smsConsent: false,
    });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'phone' })
    );
    expect(errors).not.toContainEqual(
      expect.objectContaining({ field: 'smsConsent' })
    );
  });
});

describe('validateStep4Fields', () => {
  const validStep4Data = {
    deliveryAddress: '123 Main St',
    deliveryCity: 'Houston',
    placementLocation: 'driveway',
    surfaceType: 'concrete',
  };

  it('returns no errors for valid data', () => {
    const errors = validateStep4Fields(validStep4Data);
    expect(errors).toHaveLength(0);
  });

  it('returns error when delivery address is missing', () => {
    const errors = validateStep4Fields({ ...validStep4Data, deliveryAddress: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'deliveryAddress' })
    );
  });

  it('returns error when city is missing', () => {
    const errors = validateStep4Fields({ ...validStep4Data, deliveryCity: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'deliveryCity' })
    );
  });

  it('returns error when placement location is missing', () => {
    const errors = validateStep4Fields({ ...validStep4Data, placementLocation: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'placementLocation' })
    );
  });

  it('returns error when surface type is missing', () => {
    const errors = validateStep4Fields({ ...validStep4Data, surfaceType: '' });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'surfaceType' })
    );
  });

  it('returns multiple errors when multiple fields are missing', () => {
    const errors = validateStep4Fields({
      deliveryAddress: '',
      deliveryCity: '',
      placementLocation: '',
      surfaceType: '',
    });
    expect(errors).toHaveLength(4);
  });
});
