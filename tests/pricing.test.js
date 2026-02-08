import { describe, it, expect } from 'vitest';
import {
  PRICING,
  getDeliveryZone,
  calculateQuoteFromData,
  formatCurrency,
  formatDollar,
} from '../lib.js';

describe('getDeliveryZone', () => {
  it('returns zone1 for Houston downtown ZIP codes', () => {
    expect(getDeliveryZone('77002')).toBe('zone1');
    expect(getDeliveryZone('77019')).toBe('zone1');
    expect(getDeliveryZone('77098')).toBe('zone1');
  });

  it('returns zone2 for Conroe/Woodlands area ZIP codes', () => {
    expect(getDeliveryZone('77301')).toBe('zone2');
    expect(getDeliveryZone('77304')).toBe('zone2');
    expect(getDeliveryZone('77354')).toBe('zone2');
  });

  it('returns zone3 for outer area ZIP codes', () => {
    expect(getDeliveryZone('77327')).toBe('zone3');
    expect(getDeliveryZone('77514')).toBe('zone3');
    expect(getDeliveryZone('77590')).toBe('zone3');
  });

  it('returns null for unsupported ZIP codes', () => {
    expect(getDeliveryZone('90210')).toBeNull();
    expect(getDeliveryZone('10001')).toBeNull();
    expect(getDeliveryZone('')).toBeNull();
  });
});

describe('calculateQuoteFromData', () => {
  describe('onsite storage service', () => {
    it('calculates quote for 16ft container in zone1', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'onsite',
        containerSize: '16',
        deliveryZip: '77002',
        destinationZip: '',
      });

      expect(quote).not.toBeNull();
      expect(quote.deliveryFee).toBe(79);
      expect(quote.firstMonthRent).toBe(119);
      expect(quote.monthlyRent).toBe(189);
      expect(quote.pickupFee).toBe(79);
      expect(quote.dueToday).toBe(198);
      expect(quote.zone).toBe('zone1');
    });

    it('calculates quote for 20ft container in zone2', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'onsite',
        containerSize: '20',
        deliveryZip: '77301',
        destinationZip: '',
      });

      expect(quote).not.toBeNull();
      expect(quote.deliveryFee).toBe(99);
      expect(quote.firstMonthRent).toBe(179);
      expect(quote.monthlyRent).toBe(229);
      expect(quote.pickupFee).toBe(99);
      expect(quote.dueToday).toBe(278);
      expect(quote.zone).toBe('zone2');
    });

    it('calculates quote for 16ft container in zone3', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'onsite',
        containerSize: '16',
        deliveryZip: '77327',
        destinationZip: '',
      });

      expect(quote).not.toBeNull();
      expect(quote.deliveryFee).toBe(129);
      expect(quote.firstMonthRent).toBe(119);
      expect(quote.monthlyRent).toBe(189);
      expect(quote.pickupFee).toBe(129);
      expect(quote.dueToday).toBe(248);
      expect(quote.zone).toBe('zone3');
    });
  });

  describe('moving service', () => {
    it('calculates quote with destination in different zone', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'moving',
        containerSize: '16',
        deliveryZip: '77002',
        destinationZip: '77301',
      });

      expect(quote).not.toBeNull();
      expect(quote.deliveryFee).toBe(79);
      expect(quote.monthlyRent).toBe(189);
      expect(quote.pickupFee).toBe(99);
    });

    it('calculates quote with destination in same zone', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'moving',
        containerSize: '20',
        deliveryZip: '77002',
        destinationZip: '77019',
      });

      expect(quote).not.toBeNull();
      expect(quote.deliveryFee).toBe(79);
      expect(quote.pickupFee).toBe(79);
    });
  });

  describe('storage + moving (both) service', () => {
    it('uses facility inside rate for monthly rent', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'both',
        containerSize: '16',
        deliveryZip: '77002',
        destinationZip: '77301',
      });

      expect(quote).not.toBeNull();
      expect(quote.monthlyRent).toBe(249);
      expect(quote.pickupFee).toBe(99);
    });

    it('uses facility inside rate for 20ft container', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'both',
        containerSize: '20',
        deliveryZip: '77002',
        destinationZip: '77002',
      });

      expect(quote).not.toBeNull();
      expect(quote.monthlyRent).toBe(299);
    });
  });

  describe('edge cases', () => {
    it('returns null when service type is missing', () => {
      const quote = calculateQuoteFromData({
        serviceType: '',
        containerSize: '16',
        deliveryZip: '77002',
        destinationZip: '',
      });

      expect(quote).toBeNull();
    });

    it('returns null when delivery ZIP is missing', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'onsite',
        containerSize: '16',
        deliveryZip: '',
        destinationZip: '',
      });

      expect(quote).toBeNull();
    });

    it('returns null for unsupported ZIP code', () => {
      const quote = calculateQuoteFromData({
        serviceType: 'onsite',
        containerSize: '16',
        deliveryZip: '90210',
        destinationZip: '',
      });

      expect(quote).toBeNull();
    });
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers with two decimal places', () => {
    expect(formatCurrency(79)).toBe('$79.00');
    expect(formatCurrency(100)).toBe('$100.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats decimal numbers correctly', () => {
    expect(formatCurrency(79.5)).toBe('$79.50');
    expect(formatCurrency(99.99)).toBe('$99.99');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(79.999)).toBe('$80.00');
    expect(formatCurrency(79.994)).toBe('$79.99');
  });
});

describe('formatDollar', () => {
  it('formats numbers as dollar amounts', () => {
    expect(formatDollar(79)).toBe('$79.00');
    expect(formatDollar(198)).toBe('$198.00');
  });

  it('returns non-numbers unchanged', () => {
    expect(formatDollar('already formatted')).toBe('already formatted');
    expect(formatDollar(null)).toBe(null);
    expect(formatDollar(undefined)).toBe(undefined);
  });
});

describe('PRICING configuration', () => {
  it('has correct zone1 delivery fee', () => {
    expect(PRICING.delivery.zone1.fee).toBe(79);
  });

  it('has correct zone2 delivery fee', () => {
    expect(PRICING.delivery.zone2.fee).toBe(99);
  });

  it('has correct zone3 delivery fee', () => {
    expect(PRICING.delivery.zone3.fee).toBe(129);
  });

  it('has correct first month pricing', () => {
    expect(PRICING.firstMonth['16']).toBe(119);
    expect(PRICING.firstMonth['20']).toBe(179);
  });

  it('has correct monthly pricing for 16ft container', () => {
    expect(PRICING.monthly['16'].onsite).toBe(189);
    expect(PRICING.monthly['16'].facilityInside).toBe(249);
    expect(PRICING.monthly['16'].facilityOutside).toBe(199);
  });

  it('has correct monthly pricing for 20ft container', () => {
    expect(PRICING.monthly['20'].onsite).toBe(229);
    expect(PRICING.monthly['20'].facilityInside).toBe(299);
    expect(PRICING.monthly['20'].facilityOutside).toBe(249);
  });
});
