/**
 * Tests for App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the application title', () => {
    render(<App />);
    
    const title = screen.getByText('Узбек Варс');
    expect(title).toBeInTheDocument();
  });

  it('should render welcome message', () => {
    render(<App />);
    
    const welcomeText = screen.getByText('Welcome to Uzbek Wars!');
    expect(welcomeText).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<App />);
    
    const description = screen.getByText(/Mobile-first PWA game/i);
    expect(description).toBeInTheDocument();
  });
});
