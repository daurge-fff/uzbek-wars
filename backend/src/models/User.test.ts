import { User } from './User';

/**
 * Unit tests for User model schema
 * Tests schema structure, validation rules, and indexes
 */
describe('User Model', () => {
  describe('Schema Structure', () => {
    it('should have correct schema paths', () => {
      const schema = User.schema;
      const paths = schema.paths;

      expect(paths).toHaveProperty('googleId');
      expect(paths).toHaveProperty('email');
      expect(paths).toHaveProperty('displayName');
      expect(paths).toHaveProperty('avatar');
      expect(paths).toHaveProperty('language');
      expect(paths).toHaveProperty('ipAddress');
      // Subdocument fields are flattened in paths with dot notation
      expect(paths['deviceInfo.userAgent']).toBeDefined();
      expect(paths['deviceInfo.platform']).toBeDefined();
      expect(paths['deviceInfo.deviceId']).toBeDefined();
    });

    it('should have required fields configured correctly', () => {
      const schema = User.schema;

      expect(schema.path('googleId').isRequired).toBe(true);
      expect(schema.path('email').isRequired).toBe(true);
      expect(schema.path('displayName').isRequired).toBe(true);
      // Optional fields don't have isRequired set to false, it's undefined
      expect(schema.path('avatar').isRequired).toBeUndefined();
    });

    it('should have language enum with correct values', () => {
      const schema = User.schema;
      const languagePath: any = schema.path('language');

      expect(languagePath.enumValues).toEqual(['ru', 'uz', 'uk', 'en']);
      expect(languagePath.defaultValue).toBe('ru');
    });

    it('should have deviceInfo subdocument structure', () => {
      const schema = User.schema;

      // Subdocument fields are flattened in schema.paths
      expect(schema.path('deviceInfo.userAgent')).toBeDefined();
      expect(schema.path('deviceInfo.platform')).toBeDefined();
      expect(schema.path('deviceInfo.deviceId')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      const schema = User.schema;

      expect(schema.options.timestamps).toBe(true);
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have unique index on googleId', () => {
      const schema = User.schema;
      const googleIdPath = schema.path('googleId');

      expect(googleIdPath.options.unique).toBe(true);
      expect(googleIdPath.options.index).toBe(true);
    });

    it('should have unique index on email', () => {
      const schema = User.schema;
      const emailPath = schema.path('email');

      expect(emailPath.options.unique).toBe(true);
    });

    it('should have index on ipAddress for twin detection', () => {
      const schema = User.schema;
      const ipAddressPath = schema.path('ipAddress');

      expect(ipAddressPath.options.index).toBe(true);
    });

    it('should have index on deviceInfo.deviceId for twin detection', () => {
      const schema = User.schema;
      const deviceIdPath = schema.path('deviceInfo.deviceId');

      expect(deviceIdPath.options.index).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate language enum values', () => {
      const schema = User.schema;
      const languagePath: any = schema.path('language');

      // Valid languages
      expect(languagePath.enumValues).toContain('ru');
      expect(languagePath.enumValues).toContain('uz');
      expect(languagePath.enumValues).toContain('uk');
      expect(languagePath.enumValues).toContain('en');

      // Should have exactly 4 languages
      expect(languagePath.enumValues).toHaveLength(4);
    });

    it('should have correct field types', () => {
      const schema = User.schema;

      expect(schema.path('googleId').instance).toBe('String');
      expect(schema.path('email').instance).toBe('String');
      expect(schema.path('displayName').instance).toBe('String');
      expect(schema.path('avatar').instance).toBe('String');
      expect(schema.path('language').instance).toBe('String');
      expect(schema.path('ipAddress').instance).toBe('String');
    });
  });

  describe('Model Configuration', () => {
    it('should have correct model name', () => {
      expect(User.modelName).toBe('User');
    });

    it('should have correct collection name', () => {
      expect(User.collection.name).toBe('users');
    });
  });
});
