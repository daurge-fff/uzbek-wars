/**
 * Test setup file
 * 
 * Configures testing environment and global test utilities
 */

import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from '../i18n';

// Set language to English for tests
beforeAll(async () => {
  await i18n.changeLanguage('en');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers
expect.extend({});
