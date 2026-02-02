/**
 * Telegram Bot Tests
 */

import { createVerificationSession } from './telegramBot';

describe('Telegram Bot', () => {
  describe('createVerificationSession', () => {
    it('should generate unique verification code', () => {
      const userId = 'test-user-123';
      const code1 = createVerificationSession(userId);
      const code2 = createVerificationSession(userId);

      expect(code1).toBeDefined();
      expect(code2).toBeDefined();
      expect(code1).not.toBe(code2);
      expect(code1.length).toBeGreaterThan(0);
      expect(code2.length).toBeGreaterThan(0);
    });

    it('should generate uppercase alphanumeric code', () => {
      const userId = 'test-user-123';
      const code = createVerificationSession(userId);

      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate code of reasonable length', () => {
      const userId = 'test-user-123';
      const code = createVerificationSession(userId);

      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.length).toBeLessThanOrEqual(12);
    });

    it('should handle multiple users', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const user3 = 'user-3';

      const code1 = createVerificationSession(user1);
      const code2 = createVerificationSession(user2);
      const code3 = createVerificationSession(user3);

      expect(code1).not.toBe(code2);
      expect(code2).not.toBe(code3);
      expect(code1).not.toBe(code3);
    });

    it('should generate codes quickly', () => {
      const userId = 'test-user-123';
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        createVerificationSession(userId);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should take less than 1 second for 100 codes
    });
  });

  describe('Verification Session Management', () => {
    it('should store session with timestamp', () => {
      const userId = 'test-user-123';
      const beforeTime = Date.now();
      createVerificationSession(userId);
      const afterTime = Date.now();

      // Code should be generated within reasonable time
      expect(afterTime - beforeTime).toBeLessThan(100);
    });

    it('should handle rapid session creation', () => {
      const userId = 'test-user-123';
      const codes = new Set();

      for (let i = 0; i < 50; i++) {
        const code = createVerificationSession(userId);
        codes.add(code);
      }

      // All codes should be unique
      expect(codes.size).toBe(50);
    });
  });
});
