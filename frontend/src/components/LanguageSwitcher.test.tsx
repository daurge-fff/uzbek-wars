/**
 * Tests for LanguageSwitcher component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import '../i18n'; // Initialize i18n for tests

describe('LanguageSwitcher', () => {
  it('renders all 4 language options', () => {
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // Check for language flags
    expect(screen.getByLabelText(/Switch to Русский/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Switch to O'zbekcha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Switch to Українська/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Switch to English/i)).toBeInTheDocument();
  });

  it('highlights current language', () => {
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // Default language should be highlighted (ru)
    const ruButton = screen.getByLabelText(/Switch to Русский/i);
    expect(ruButton).toHaveClass('bg-primary');
  });

  it('calls onLanguageChange callback when language is changed', () => {
    const onLanguageChange = vi.fn();
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={onLanguageChange} />);
    
    // Click on English button
    const enButton = screen.getByLabelText(/Switch to English/i);
    fireEvent.click(enButton);
    
    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });

  it('renders in compact mode by default', () => {
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} />);
    
    // In compact mode, language names should not be visible
    expect(screen.queryByText('Русский')).not.toBeInTheDocument();
  });

  it('renders language names in full mode', () => {
    render(<LanguageSwitcher currentLanguage="ru" onLanguageChange={vi.fn()} mode="full" />);
    
    // In full mode, language names should be visible
    expect(screen.getByText('Русский')).toBeInTheDocument();
    expect(screen.getByText("O'zbekcha")).toBeInTheDocument();
    expect(screen.getByText('Українська')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
