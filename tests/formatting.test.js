import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatDollar } from '../lib.js';

describe('formatDate', () => {
  it('formats date strings correctly', () => {
    const result = formatDate('2025-02-15');
    expect(result).toContain('Feb');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('returns -- for empty date string', () => {
    expect(formatDate('')).toBe('--');
  });

  it('returns -- for null date', () => {
    expect(formatDate(null)).toBe('--');
  });

  it('returns -- for undefined date', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('includes weekday in the formatted output', () => {
    const result = formatDate('2025-02-15');
    expect(result).toContain('Sat');
  });

  it('handles dates at year boundaries', () => {
    const result = formatDate('2025-01-01');
    expect(result).toContain('Jan');
    expect(result).toContain('1');
    expect(result).toContain('2025');
  });

  it('handles end of year dates', () => {
    const result = formatDate('2025-12-31');
    expect(result).toContain('Dec');
    expect(result).toContain('31');
    expect(result).toContain('2025');
  });
});

describe('formatCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats positive integers', () => {
    expect(formatCurrency(100)).toBe('$100.00');
    expect(formatCurrency(1)).toBe('$1.00');
    expect(formatCurrency(999)).toBe('$999.00');
  });

  it('formats decimals with two decimal places', () => {
    expect(formatCurrency(99.99)).toBe('$99.99');
    expect(formatCurrency(50.5)).toBe('$50.50');
    expect(formatCurrency(10.1)).toBe('$10.10');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(99.999)).toBe('$100.00');
    expect(formatCurrency(99.994)).toBe('$99.99');
    expect(formatCurrency(99.995)).toBe('$100.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000)).toBe('$1000.00');
    expect(formatCurrency(10000.50)).toBe('$10000.50');
  });
});

describe('formatDollar', () => {
  it('formats numbers as dollar amounts', () => {
    expect(formatDollar(79)).toBe('$79.00');
    expect(formatDollar(198.50)).toBe('$198.50');
  });

  it('returns strings unchanged', () => {
    expect(formatDollar('$79.00')).toBe('$79.00');
    expect(formatDollar('free')).toBe('free');
  });

  it('returns null unchanged', () => {
    expect(formatDollar(null)).toBe(null);
  });

  it('returns undefined unchanged', () => {
    expect(formatDollar(undefined)).toBe(undefined);
  });

  it('handles zero', () => {
    expect(formatDollar(0)).toBe('$0.00');
  });
});
