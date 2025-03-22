/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test/client/'],
  testMatch: ['**/test/client/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    // Handle CSS imports for React component tests
    '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/client/src/**/*.{ts,tsx}',
    '!src/client/src/main.tsx',
    '!src/client/src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage-client',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/test/client/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  }
};