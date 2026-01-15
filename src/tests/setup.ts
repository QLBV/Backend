


process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-min-32-characters-for-testing";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-32-characters-for-testing";
process.env.DB_NAME = "healthcare_test_db";


global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
