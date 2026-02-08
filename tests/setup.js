// Test setup file for Vitest with jsdom
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
