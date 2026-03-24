import 'jest-extended';

/**
 * Jest setup file - runs before all tests
 * Configures test environment and global mocks
 */

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.BASE_URL = 'https://openrouter.ai/api/v1';
process.env.ANALYSIS_MODEL = 'openrouter/free';
process.env.DATABASE_URL = 'sqlite:./test.db';
process.env.NODE_ENV = 'test';

// Suppress console output during tests (except errors)
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      args[0]?.includes?.('WARN') ||
      args[0]?.includes?.('deprecated') ||
      args[0]?.includes?.('ExperimentalWarning')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});
