
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  
  testMatch: [
    '**/tests*.test.ts',
    '**/__tests__*.test.ts'
  ],
  
  
  collectCoverageFrom: [
    'src*.{ts,js}',
    '!src*.d.ts',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/config/**',
    '!src/server.ts',
    '!src/app.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  
  
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  
  testTimeout: 30000,
  
  
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  
  verbose: true,
  
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
