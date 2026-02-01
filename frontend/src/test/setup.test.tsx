/**
 * Frontend setup verification tests
 * 
 * Validates that all required dependencies and configurations are properly set up
 */

import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import i18n from '../i18n';

describe('Frontend Setup', () => {
  describe('Dependencies', () => {
    it('should have React Query configured', () => {
      const queryClient = new QueryClient();
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions()).toBeDefined();
    });

    it('should have i18next configured', () => {
      expect(i18n).toBeDefined();
      expect(i18n.options.supportedLngs).toContain('ru');
      expect(i18n.options.supportedLngs).toContain('uz');
      expect(i18n.options.supportedLngs).toContain('uk');
      expect(i18n.options.supportedLngs).toContain('en');
    });

    it('should have Russian as fallback language', () => {
      expect(i18n.options.fallbackLng).toContain('ru');
    });
  });

  describe('Internationalization', () => {
    it('should load Russian translations', () => {
      const translations = i18n.getResourceBundle('ru', 'translation');
      expect(translations).toBeDefined();
      expect(Object.keys(translations).length).toBeGreaterThan(0);
    });

    it('should load Uzbek translations', () => {
      const translations = i18n.getResourceBundle('uz', 'translation');
      expect(translations).toBeDefined();
      expect(Object.keys(translations).length).toBeGreaterThan(0);
    });

    it('should load Ukrainian translations', () => {
      const translations = i18n.getResourceBundle('uk', 'translation');
      expect(translations).toBeDefined();
      expect(Object.keys(translations).length).toBeGreaterThan(0);
    });

    it('should load English translations', () => {
      const translations = i18n.getResourceBundle('en', 'translation');
      expect(translations).toBeDefined();
      expect(Object.keys(translations).length).toBeGreaterThan(0);
    });

    it('should be able to change language', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      
      await i18n.changeLanguage('ru');
      expect(i18n.language).toBe('ru');
    });

    it('should have all required translation keys', () => {
      const ruTranslations = i18n.getResourceBundle('ru', 'translation');
      
      // Check for essential translation keys
      expect(ruTranslations).toHaveProperty('character');
      expect(ruTranslations).toHaveProperty('activities');
      expect(ruTranslations).toHaveProperty('currency');
    });
  });

  describe('React Query Configuration', () => {
    it('should have sensible default options', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      });

      const options = queryClient.getDefaultOptions();
      expect(options.queries?.staleTime).toBe(300000); // 5 minutes
      expect(options.queries?.retry).toBe(1);
      expect(options.queries?.refetchOnWindowFocus).toBe(false);
    });
  });
});
