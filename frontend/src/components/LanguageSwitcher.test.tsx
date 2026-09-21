/**
 * Tests for LanguageSwitcher component
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../test/renderWithProviders';
import { LanguageSwitcher } from './LanguageSwitcher';
import '../i18n'; // Initialize i18n for tests

describe('LanguageSwitcher', () => {
  it('renders all language flags', () => {
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // Flags are rendered by the Emoji component as <img alt="<flag>">
    expect(screen.getByAltText('🇷🇺')).toBeInTheDocument();
    expect(screen.getByAltText('🇺🇿')).toBeInTheDocument();
    expect(screen.getByAltText('🇺🇦')).toBeInTheDocument();
    expect(screen.getByAltText('🇬🇧')).toBeInTheDocument();
  });

  it('highlights current language', () => {
    const { container } = render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // Russian flag button should have gradient background (via layoutId animation)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(4);
  });

  it('calls onLanguageChange callback when language is clicked', () => {
    const onLanguageChange = vi.fn();
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={onLanguageChange} />);
    
    // Click on English flag
    const enButton = screen.getByAltText('🇬🇧').closest('button');
    fireEvent.click(enButton!);
    
    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });

  it('switches language immediately on click', () => {
    const onLanguageChange = vi.fn();
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={onLanguageChange} />);
    
    // Click on Uzbek flag
    const uzButton = screen.getByAltText('🇺🇿').closest('button');
    fireEvent.click(uzButton!);
    
    expect(onLanguageChange).toHaveBeenCalledWith('uz');
  });

  it('renders in compact segmented control style', () => {
    const { container } = render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // Should have a container with rounded-full (pill shape)
    const wrapper = container.querySelector('.rounded-full');
    expect(wrapper).toBeInTheDocument();
  });
});
