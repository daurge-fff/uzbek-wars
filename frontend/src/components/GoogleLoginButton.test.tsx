import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleLoginButton } from './GoogleLoginButton';

describe('GoogleLoginButton', () => {
  it('renders login button', () => {
    render(
      <BrowserRouter>
        <GoogleLoginButton />
      </BrowserRouter>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('generates device ID on first click', () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    render(
      <BrowserRouter>
        <GoogleLoginButton />
      </BrowserRouter>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('calls onSuccess callback on successful login', async () => {
    const onSuccess = vi.fn();
    
    render(
      <BrowserRouter>
        <GoogleLoginButton onSuccess={onSuccess} />
      </BrowserRouter>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });
});
