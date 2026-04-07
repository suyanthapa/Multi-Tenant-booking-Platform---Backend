// suppress all logger output during tests
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// src/tests/setup.ts
process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/testdb";
process.env.JWT_ACCESS_SECRET = "fake-access-secret";
process.env.JWT_REFRESH_SECRET = "fake-refresh-secret";
process.env.JWT_RESET_SECRET = "fake-reset-secret";
process.env.EMAIL_USER = "fake@email.com";
process.env.EMAIL_PASSWORD = "fake-password";
process.env.RESEND_API_KEY = "fake-resend-key";
process.env.NODE_ENV = "test";
