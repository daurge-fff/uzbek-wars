/**
 * Tests for App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the application', () => {
    render(<App />);
    
    // Check that app renders without crashing
    expect(document.body).toBeTruthy();
  });

  it('should render welcome message on home page', () => {
    render(<App />);
    
    const welcomeText = screen.getByText('Добро пожаловать');
    expect(welcomeText).toBeInTheDocument();
  });

  it('should render app title', () => {
    render(<App />);
    
    const title = screen.getByText('Узбек Варс');
    expect(title).toBeInTheDocument();
  });
});
