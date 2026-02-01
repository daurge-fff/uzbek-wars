/**
 * Tests for environment configuration validation
 */

import { validateEnvironment } from './environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error when required variables are missing', () => {
    // Remove required variables
    delete process.env.MONGODB_URI;
    delete process.env.DB_NAME;
    delete process.env.JWT_SECRET;

    expect(() => validateEnvironment()).toThrow('Missing required environment variables');
  });

  it('should pass validation when all required variables are present', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
    process.env.DB_NAME = 'test_db';
    process.env.JWT_SECRET = 'test_secret';
    process.env.GOOGLE_CLIENT_ID = 'test_client_id';
    process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';

    expect(() => validateEnvironment()).not.toThrow();
  });
});
