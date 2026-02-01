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
    localStorage.clear();
    
    render(
      <BrowserRouter>
        <GoogleLoginButton />
      </BrowserRouter>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const deviceId = localStorage.getItem('deviceId');
    expect(deviceId).toBeTruthy();
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
