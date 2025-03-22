// Client test setup
import '@testing-library/jest-dom';

// Set up browser globals 
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
});

// Increase Jest timeout for React tests
jest.setTimeout(5000);