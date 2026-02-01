/**
 * BackButton Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BackButton } from './BackButton';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('BackButton Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render back button', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should display back arrow', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );

    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('should navigate to home on click', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should have proper styling classes', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('top-4');
    expect(button).toHaveClass('left-4');
    expect(button).toHaveClass('backdrop-blur-xl');
  });

  it('should be positioned with high z-index', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('z-[9999]');
  });
});
