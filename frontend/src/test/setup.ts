/**
 * Test setup file
 * 
 * Configures testing environment and global test utilities
 */

import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from '../i18n';

/**
 * Restore jsdom web storage.
 *
 * Node exposes `localStorage`/`sessionStorage` as globals (webstorage). Those
 * stubs have no `getItem`/`setItem` unless Node is started with
 * `--localstorage-file`, and because Vitest only copies jsdom window keys that
 * are either absent from `globalThis` or on its own known-key list, the stubs
 * shadow jsdom's working implementations. Re-point the globals at jsdom's
 * storage so components using localStorage behave like in the browser.
 */
function restoreWebStorage(name: 'localStorage' | 'sessionStorage'): void {
  const current = (globalThis as Record<string, unknown>)[name] as Storage | undefined;
  if (current && typeof current.getItem === 'function') return;

  const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
  const jsdomStorage = jsdomWindow?.[name];
  if (!jsdomStorage) return;

  Object.defineProperty(globalThis, name, {
    get: () => jsdomStorage,
    set: () => undefined,
    configurable: true
  });
}

restoreWebStorage('localStorage');
restoreWebStorage('sessionStorage');

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
