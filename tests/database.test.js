import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto.getRandomValues for deterministic testing
const mockGetRandomValues = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: { getRandomValues: mockGetRandomValues },
  writable: true,
});

// Import after mocking crypto
const {
  generateQuoteId,
  insertQuote,
  getQuoteByQuoteId,
  updateQuoteToBooked,
  updateQuoteFlags,
  insertBookingQuote,
} = await import('../worker/src/services/database.ts');

const VALID_CHARSET = '2346789ABCDEFGHJKMNPQRTUVWXYZ';

function createMockDb(options = {}) {
  const firstResult = options.firstResult || null;
  const bindResult = {
    first: vi.fn().mockResolvedValue(firstResult),
    run: vi.fn().mockResolvedValue({ meta: { changes: options.changes ?? 1 } }),
  };
  const prepared = {
    bind: vi.fn().mockReturnValue(bindResult),
  };
  return {
    prepare: vi.fn().mockReturnValue(prepared),
    _prepared: prepared,
    _bindResult: bindResult,
  };
}

describe('generateQuoteId', () => {
  beforeEach(() => {
    mockGetRandomValues.mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  it('returns string matching Q-XXXXX pattern', async () => {
    const db = createMockDb();
    const id = await generateQuoteId(db);
    expect(id).toMatch(/^Q-[A-Z0-9]{5}$/);
  });

  it('only uses valid charset characters', async () => {
    const db = createMockDb();
    const id = await generateQuoteId(db);
    const chars = id.slice(2); // Remove "Q-" prefix
    for (const c of chars) {
      expect(VALID_CHARSET).toContain(c);
    }
  });

  it('does not contain ambiguous characters (0, O, 1, I, L, 5, S)', async () => {
    // Generate several IDs to check
    const db = createMockDb();
    for (let i = 0; i < 20; i++) {
      const id = await generateQuoteId(db);
      expect(id).not.toMatch(/[0O1IL5S]/);
    }
  });

  it('generates different IDs on successive calls', async () => {
    const db = createMockDb();
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      ids.add(await generateQuoteId(db));
    }
    // With random generation, at least some should be unique
    expect(ids.size).toBeGreaterThan(1);
  });

  it('retries on collision and returns unique ID', async () => {
    let callCount = 0;
    const bindResult = {
      first: vi.fn().mockImplementation(() => {
        callCount++;
        // First call returns existing record (collision), second returns null (unique)
        return Promise.resolve(callCount === 1 ? { quote_id: 'Q-XXXXX' } : null);
      }),
    };
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue(bindResult),
      }),
    };

    const id = await generateQuoteId(db);
    expect(id).toMatch(/^Q-[A-Z0-9]{5}$/);
    expect(callCount).toBe(2);
  });

  it('throws after max retries when all collide', async () => {
    const bindResult = {
      first: vi.fn().mockResolvedValue({ quote_id: 'Q-XXXXX' }), // Always collides
    };
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue(bindResult),
      }),
    };

    await expect(generateQuoteId(db)).rejects.toThrow('Failed to generate unique quote ID');
  });
});

describe('insertQuote', () => {
  it('inserts record with all quote fields', async () => {
    const db = createMockDb();
    const data = {
      serviceDisplay: 'Storage - At My Property',
      boxSize: '8x16',
      deliveryZip: '77002',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      deliveryFee: '$79.00',
      firstMonthRent: '$119.00',
      monthlyRent: '$189.00',
      dueToday: '$198.00',
      ongoingMonthly: '$189.00',
    };

    const result = await insertQuote(db, 'Q-ABC23', data);
    expect(result).toBe('Q-ABC23');
    expect(db.prepare).toHaveBeenCalled();
    expect(db._prepared.bind).toHaveBeenCalled();
  });

  it('returns the provided quote_id', async () => {
    const db = createMockDb();
    const result = await insertQuote(db, 'Q-XY789', {});
    expect(result).toBe('Q-XY789');
  });

  it('handles missing optional fields', async () => {
    const db = createMockDb();
    const result = await insertQuote(db, 'Q-TEST1', {
      email: 'test@test.com',
    });
    expect(result).toBe('Q-TEST1');
  });
});

describe('getQuoteByQuoteId', () => {
  it('returns quote data when found with status quoted', async () => {
    const mockRow = {
      quote_id: 'Q-ABC23',
      status: 'quoted',
      created_at: '2026-01-01T00:00:00.000Z',
      service_display: 'Storage - At My Property',
      box_size: '8x16',
      delivery_zip: '77002',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      delivery_fee: '$79.00',
      first_month_rent: '$119.00',
      monthly_rent: '$189.00',
      due_today: '$198.00',
      ongoing_monthly: '$189.00',
    };
    const db = createMockDb({ firstResult: mockRow });

    const result = await getQuoteByQuoteId(db, 'Q-ABC23');
    expect(result).not.toBeNull();
    expect(result.quoteId).toBe('Q-ABC23');
    expect(result.firstName).toBe('John');
    expect(result.deliveryFee).toBe('$79.00');
  });

  it('returns null when quote_id does not exist', async () => {
    const db = createMockDb({ firstResult: null });
    const result = await getQuoteByQuoteId(db, 'Q-NOPE1');
    expect(result).toBeNull();
  });

  it('excludes internal flags from returned data', async () => {
    const mockRow = {
      quote_id: 'Q-ABC23',
      status: 'quoted',
      created_at: '2026-01-01T00:00:00.000Z',
      stella_forwarded: 1,
      email_sent: 1,
      sms_sent: 0,
      id: 42,
    };
    const db = createMockDb({ firstResult: mockRow });

    const result = await getQuoteByQuoteId(db, 'Q-ABC23');
    expect(result).not.toHaveProperty('stella_forwarded');
    expect(result).not.toHaveProperty('email_sent');
    expect(result).not.toHaveProperty('sms_sent');
    expect(result).not.toHaveProperty('id');
  });
});

describe('updateQuoteToBooked', () => {
  it('returns true on successful update', async () => {
    const db = createMockDb({ changes: 1 });
    const result = await updateQuoteToBooked(db, 'Q-ABC23', {
      deliveryAddress: '123 Main St',
      city: 'Houston',
      state: 'TX',
      placement: 'Driveway',
      surfaceType: 'Concrete',
    });
    expect(result).toBe(true);
  });

  it('returns false when quoteId not found', async () => {
    const db = createMockDb({ changes: 0 });
    const result = await updateQuoteToBooked(db, 'Q-NOPE1', {
      deliveryAddress: '123 Main St',
    });
    expect(result).toBe(false);
  });

  it('passes booking data fields to D1', async () => {
    const db = createMockDb({ changes: 1 });
    await updateQuoteToBooked(db, 'Q-ABC23', {
      deliveryAddress: '123 Main St',
      city: 'Houston',
      state: 'TX',
      placement: 'Driveway',
      surfaceType: 'Concrete',
      doorFacing: 'Street',
      gateCode: '1234',
      notes: 'Please call on arrival',
    });

    const bindArgs = db._prepared.bind.mock.calls[0];
    expect(bindArgs).toContain('123 Main St');
    expect(bindArgs).toContain('Houston');
    expect(bindArgs).toContain('TX');
    expect(bindArgs).toContain('Driveway');
    expect(bindArgs).toContain('Concrete');
    expect(bindArgs).toContain('Street');
    expect(bindArgs).toContain('1234');
    expect(bindArgs).toContain('Please call on arrival');
  });
});

describe('updateQuoteFlags', () => {
  it('updates email_sent flag', async () => {
    const db = createMockDb();
    await updateQuoteFlags(db, 'Q-ABC23', { email_sent: 1 });
    expect(db.prepare).toHaveBeenCalled();
    const sql = db.prepare.mock.calls[0][0];
    expect(sql).toContain('email_sent');
  });

  it('updates stella_forwarded flag', async () => {
    const db = createMockDb();
    await updateQuoteFlags(db, 'Q-ABC23', { stella_forwarded: 1 });
    const sql = db.prepare.mock.calls[0][0];
    expect(sql).toContain('stella_forwarded');
  });

  it('does nothing when no flags specified', async () => {
    const db = createMockDb();
    await updateQuoteFlags(db, 'Q-ABC23', {});
    expect(db.prepare).not.toHaveBeenCalled();
  });
});

describe('insertBookingQuote', () => {
  it('inserts a full booking record', async () => {
    const db = createMockDb();
    const result = await insertBookingQuote(db, 'Q-BK123', {
      serviceDisplay: 'Moving - To New Location',
      boxSize: '8x20',
      deliveryZip: '77002',
      firstName: 'Jane',
      email: 'jane@example.com',
      deliveryAddress: '456 Oak Ave',
      city: 'Houston',
      state: 'TX',
      placement: 'Backyard',
      surfaceType: 'Grass',
    });
    expect(result).toBe('Q-BK123');
    expect(db.prepare).toHaveBeenCalled();
  });
});
