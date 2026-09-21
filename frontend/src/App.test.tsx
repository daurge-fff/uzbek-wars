/**
 * Tests for App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import i18n from './i18n';

describe('App Component', () => {
  it('should render the application', () => {
    render(<App />);
    
    // Check that app renders without crashing
    expect(document.body).toBeTruthy();
  });

  it('should render welcome message on home page', () => {
    render(<App />);
    
    // The home hero shows the localized tagline to visitors.
    const welcomeText = screen.getByText(i18n.t('app.tagline'));
    expect(welcomeText).toBeInTheDocument();
  });

  it('should render app title', () => {
    render(<App />);
    
    // The hero heading renders the localized app name (identical in all locales).
    const title = screen.getByText('UZBEK WARS');
    expect(title).toBeInTheDocument();
  });
});
