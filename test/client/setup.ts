// Client test setup
import { beforeEach, vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Set up browser globals 
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});

// Increase Vitest timeout for React tests
vi.setConfig({ testTimeout: 5000 });