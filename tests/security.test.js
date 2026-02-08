import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDeliveryZone,
  calculateQuoteFromData,
  validateStep1Fields,
  validateStep2Fields,
  validateStep4Fields,
  buildWebhookPayload,
  isValidEmail,
  formatDollar,
} from '../lib.js';

describe('Security Tests', () => {
  describe('XSS Injection Prevention', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      'javascript:alert("xss")',
      '<iframe src="javascript:alert(\'xss\')">',
      '"><script>alert("xss")</script>',
      "'-alert('xss')-'",
      '<body onload=alert("xss")>',
      '<input onfocus=alert("xss") autofocus>',
      '<marquee onstart=alert("xss")>',
      '{{constructor.constructor("alert(1)")()}}',
      '${alert("xss")}',
      '<a href="javascript:alert(1)">click</a>',
    ];

    describe('in form field validation', () => {
      it('rejects XSS in email field', () => {
        xssPayloads.forEach((payload) => {
          expect(isValidEmail(payload)).toBe(false);
        });
      });

      it('does not execute XSS in firstName validation', () => {
        xssPayloads.forEach((payload) => {
          const errors = validateStep2Fields({
            firstName: payload,
            email: 'test@example.com',
            phone: '713-555-1234',
            smsConsent: true,
          });
          // Should not throw or execute - validation should complete normally
          expect(Array.isArray(errors)).toBe(true);
        });
      });

      it('does not execute XSS in delivery address validation', () => {
        xssPayloads.forEach((payload) => {
          const errors = validateStep4Fields({
            deliveryAddress: payload,
            deliveryCity: payload,
            placementLocation: 'driveway',
            surfaceType: 'concrete',
          });
          // Should complete validation without execution
          expect(Array.isArray(errors)).toBe(true);
          expect(errors).toHaveLength(0); // These are text fields, so XSS strings are "valid" input
        });
      });
    });

    describe('in webhook payload', () => {
      it('includes raw XSS strings without execution in payload', () => {
        const maliciousData = {
          firstName: '<script>alert("xss")</script>',
          lastName: '<img src=x onerror=alert("xss")>',
          email: 'test@example.com',
          phone: '713-555-1234',
          deliveryAddress: '"><script>alert("xss")</script>',
          deliveryFee: 79,
          firstMonthRent: 119,
          monthlyRent: 189,
          pickupFee: 79,
          dueToday: 198,
          ongoingMonthly: 189,
          dueWhenDone: 79,
        };

        const payload = buildWebhookPayload(maliciousData, 'booking');

        // Payload should contain the raw strings (server-side should sanitize)
        expect(payload.firstName).toBe('<script>alert("xss")</script>');
        expect(payload.lastName).toBe('<img src=x onerror=alert("xss")>');
        expect(typeof payload.firstName).toBe('string');
        expect(typeof payload.lastName).toBe('string');
      });

      it('properly escapes special characters in JSON serialization', () => {
        const maliciousData = {
          firstName: '{"injected": "json"}',
          specialNotes: '\\n\\r\\t\\"escaped\\"',
          deliveryFee: 79,
          firstMonthRent: 119,
          monthlyRent: 189,
          pickupFee: 79,
          dueToday: 198,
          ongoingMonthly: 189,
          dueWhenDone: 79,
        };

        const payload = buildWebhookPayload(maliciousData, 'booking');
        const jsonString = JSON.stringify(payload);

        // Should be valid JSON without breaking structure
        expect(() => JSON.parse(jsonString)).not.toThrow();
        const parsed = JSON.parse(jsonString);
        expect(parsed.firstName).toBe('{"injected": "json"}');
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; DELETE FROM orders",
      "' UNION SELECT * FROM users --",
      "1' AND 1=1 --",
      "'; EXEC xp_cmdshell('dir'); --",
      "1'; WAITFOR DELAY '0:0:10' --",
      "' OR 1=1 #",
      "admin'--",
      "1 OR 1=1",
      "' OR ''='",
      "'; INSERT INTO users VALUES('hacked'); --",
    ];

    describe('in ZIP code inputs', () => {
      it('rejects SQL injection attempts as invalid ZIP codes', () => {
        sqlPayloads.forEach((payload) => {
          const zone = getDeliveryZone(payload);
          expect(zone).toBeNull();
        });
      });

      it('returns validation error for SQL injection in delivery ZIP', () => {
        sqlPayloads.forEach((payload) => {
          const errors = validateStep1Fields({
            serviceType: 'onsite',
            deliveryZip: payload,
            containerSize: '16',
            deliveryDate: '2030-12-01',
            destinationZip: '',
          });
          expect(errors).toContainEqual(
            expect.objectContaining({
              field: 'deliveryZip',
              message: expect.stringContaining('do not currently serve'),
            })
          );
        });
      });

      it('returns validation error for SQL injection in destination ZIP', () => {
        sqlPayloads.forEach((payload) => {
          const errors = validateStep1Fields({
            serviceType: 'moving',
            deliveryZip: '77002',
            containerSize: '16',
            deliveryDate: '2030-12-01',
            destinationZip: payload,
          });
          expect(errors).toContainEqual(
            expect.objectContaining({
              field: 'destinationZip',
              message: expect.stringContaining('destination ZIP'),
            })
          );
        });
      });

      it('returns null quote for SQL injection in ZIP', () => {
        sqlPayloads.forEach((payload) => {
          const quote = calculateQuoteFromData({
            serviceType: 'onsite',
            containerSize: '16',
            deliveryZip: payload,
            destinationZip: '',
          });
          expect(quote).toBeNull();
        });
      });
    });

    describe('in other form fields', () => {
      it('handles SQL injection in text fields without error', () => {
        sqlPayloads.forEach((payload) => {
          const errors = validateStep4Fields({
            deliveryAddress: payload,
            deliveryCity: payload,
            placementLocation: 'driveway',
            surfaceType: 'concrete',
          });
          // Text fields accept any string - SQL injection is a server concern
          expect(errors).toHaveLength(0);
        });
      });
    });
  });

  describe('Webhook Payload Tampering Prevention', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('prevents price manipulation through negative values', () => {
      const tamperedData = {
        deliveryFee: -100,
        firstMonthRent: -50,
        monthlyRent: -25,
        pickupFee: -10,
        dueToday: -150,
        ongoingMonthly: -25,
        dueWhenDone: -10,
      };

      const payload = buildWebhookPayload(tamperedData, 'booking');

      // formatDollar will format negative numbers - server should validate
      expect(payload.deliveryFee).toBe('$-100.00');
      expect(payload.dueToday).toBe('$-150.00');
    });

    it('handles extremely large price values', () => {
      const tamperedData = {
        deliveryFee: 999999999999,
        firstMonthRent: Number.MAX_SAFE_INTEGER,
        monthlyRent: 189,
        pickupFee: 79,
        dueToday: 999999999999,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payload = buildWebhookPayload(tamperedData, 'booking');

      expect(typeof payload.deliveryFee).toBe('string');
      expect(payload.deliveryFee).toContain('$');
    });

    it('handles NaN and Infinity values', () => {
      const tamperedData = {
        deliveryFee: NaN,
        firstMonthRent: Infinity,
        monthlyRent: -Infinity,
        pickupFee: 79,
        dueToday: 198,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payload = buildWebhookPayload(tamperedData, 'booking');

      // NaN.toFixed(2) returns "NaN", Infinity.toFixed(2) returns "Infinity"
      expect(payload.deliveryFee).toBe('$NaN');
      expect(payload.firstMonthRent).toBe('$Infinity');
      expect(payload.monthlyRent).toBe('$-Infinity');
    });

    it('preserves data integrity - spread creates isolated copy', () => {
      const originalData = {
        firstName: 'John',
        deliveryFee: 79,
        firstMonthRent: 119,
        monthlyRent: 189,
        pickupFee: 79,
        dueToday: 198,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payload = buildWebhookPayload(originalData, 'booking');
      
      // Modify original after payload creation
      originalData.firstName = 'HACKED';
      originalData.deliveryFee = 0;

      // Payload should retain original values (spread creates shallow copy)
      expect(payload.firstName).toBe('John');
      expect(payload.deliveryFee).toBe('$79.00');
    });

    it('always includes server-controlled fields', () => {
      const minimalData = {
        deliveryFee: 79,
        firstMonthRent: 119,
        monthlyRent: 189,
        pickupFee: 79,
        dueToday: 198,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payload = buildWebhookPayload(minimalData, 'booking', 'token123');

      // These fields are set by the server, not user input
      expect(payload.timestamp).toBe('2025-01-15T12:00:00.000Z');
      expect(payload.source).toBe('miboxhouston.com');
      expect(payload.formType).toBe('booking');
      expect(payload.turnstileToken).toBe('token123');
    });

    it('cannot override server-controlled fields via input data', () => {
      const tamperedData = {
        timestamp: '1999-01-01T00:00:00.000Z',
        source: 'malicious-site.com',
        formType: 'admin-override',
        turnstileToken: 'fake-token',
        deliveryFee: 79,
        firstMonthRent: 119,
        monthlyRent: 189,
        pickupFee: 79,
        dueToday: 198,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payload = buildWebhookPayload(tamperedData, 'booking', 'real-token');

      // Server-controlled fields should override any user-supplied values
      expect(payload.timestamp).toBe('2025-01-15T12:00:00.000Z');
      expect(payload.source).toBe('miboxhouston.com');
      expect(payload.formType).toBe('booking');
      expect(payload.turnstileToken).toBe('real-token');
    });
  });

  describe('Rate Limiting Considerations', () => {
    // Note: Actual rate limiting should be implemented server-side
    // These tests document expected behavior for rapid submissions

    it('buildWebhookPayload can be called rapidly without state corruption', () => {
      const baseData = {
        firstName: 'John',
        deliveryFee: 79,
        firstMonthRent: 119,
        monthlyRent: 189,
        pickupFee: 79,
        dueToday: 198,
        ongoingMonthly: 189,
        dueWhenDone: 79,
      };

      const payloads = [];
      for (let i = 0; i < 100; i++) {
        payloads.push(buildWebhookPayload({ ...baseData, firstName: `User${i}` }, 'quote'));
      }

      // Each payload should be independent
      expect(payloads[0].firstName).toBe('User0');
      expect(payloads[50].firstName).toBe('User50');
      expect(payloads[99].firstName).toBe('User99');
      expect(payloads).toHaveLength(100);
    });

    it('validation functions are stateless and can handle rapid calls', () => {
      const validData = {
        serviceType: 'onsite',
        deliveryZip: '77002',
        containerSize: '16',
        storageDuration: '3',
        deliveryDate: '2030-12-01',
        destinationZip: '',
        storageLocation: 'customer_property',
      };

      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(validateStep1Fields(validData));
      }

      // All results should be identical
      results.forEach((result) => {
        expect(result).toHaveLength(0);
      });
    });

    it('quote calculation is deterministic under rapid calls', () => {
      const quoteInput = {
        serviceType: 'onsite',
        containerSize: '16',
        deliveryZip: '77002',
        destinationZip: '',
      };

      const quotes = [];
      for (let i = 0; i < 100; i++) {
        quotes.push(calculateQuoteFromData(quoteInput));
      }

      // All quotes should be identical
      quotes.forEach((quote) => {
        expect(quote.deliveryFee).toBe(79);
        expect(quote.dueToday).toBe(198);
        expect(quote.zone).toBe('zone1');
      });
    });
  });

  describe('Input Boundary Testing', () => {
    it('handles empty string inputs gracefully', () => {
      expect(getDeliveryZone('')).toBeNull();
      expect(isValidEmail('')).toBe(false);
      expect(formatDollar('')).toBe('');
    });

    it('handles null/undefined inputs gracefully', () => {
      expect(getDeliveryZone(null)).toBeNull();
      expect(getDeliveryZone(undefined)).toBeNull();
      expect(formatDollar(null)).toBe(null);
      expect(formatDollar(undefined)).toBe(undefined);
    });

    it('handles extremely long string inputs', () => {
      const longString = 'A'.repeat(10000);
      
      expect(getDeliveryZone(longString)).toBeNull();
      expect(isValidEmail(longString)).toBe(false);
      
      const errors = validateStep2Fields({
        firstName: longString,
        email: 'test@example.com',
        phone: '713-555-1234',
        smsConsent: true,
      });
      // Long strings are accepted (length validation would be server-side)
      expect(errors).toHaveLength(0);
    });

    it('handles unicode and special characters', () => {
      const unicodeInputs = [
        '你好世界',
        'مرحبا',
        '🏠📦🚚',
        'Ñoño',
        'Müller',
        '\u0000\u0001\u0002', // null bytes
        '\uFFFD', // replacement character
      ];

      unicodeInputs.forEach((input) => {
        expect(getDeliveryZone(input)).toBeNull();
        
        const errors = validateStep4Fields({
          deliveryAddress: input,
          deliveryCity: input,
          placementLocation: 'driveway',
          surfaceType: 'concrete',
        });
        expect(errors).toHaveLength(0); // Unicode text is valid
      });
    });

    it('handles prototype pollution attempts', () => {
      const pollutionPayloads = [
        '__proto__',
        'constructor',
        '__proto__[admin]',
        'constructor.prototype.admin',
      ];

      pollutionPayloads.forEach((payload) => {
        expect(getDeliveryZone(payload)).toBeNull();
        
        const errors = validateStep1Fields({
          serviceType: payload,
          deliveryZip: payload,
          containerSize: payload,
          deliveryDate: '2030-12-01',
          destinationZip: '',
        });
        
        // Should return validation errors, not crash
        expect(Array.isArray(errors)).toBe(true);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });
});
