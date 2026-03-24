module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/lib/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^isomorphic-dompurify$': '<rootDir>/src/__tests__/mocks/dompurify.mock.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(isomorphic-dompurify|html-encoding-sniffer|jsdom|jsdom-worker)/)',
  ],
  verbose: true,
  testTimeout: 10000,
};



