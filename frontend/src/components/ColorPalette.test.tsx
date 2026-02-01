/**
 * Color Palette Component Tests
 * 
 * Validates that the Uzbek color palette is properly rendered
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColorPalette } from './ColorPalette';

describe('ColorPalette Component', () => {
  it('should render without crashing', () => {
    render(<ColorPalette />);
    expect(screen.getByText('Uzbek Wars Color Palette')).toBeInTheDocument();
  });

  it('should display all color sections', () => {
    render(<ColorPalette />);
    
    expect(screen.getByText('Primary Colors')).toBeInTheDocument();
    expect(screen.getByText('Secondary Colors')).toBeInTheDocument();
    expect(screen.getByText('Accent Colors')).toBeInTheDocument();
    expect(screen.getByText('Background Colors')).toBeInTheDocument();
    expect(screen.getByText('Text Colors')).toBeInTheDocument();
    expect(screen.getByText('Status Colors')).toBeInTheDocument();
  });

  it('should display typography section', () => {
    render(<ColorPalette />);
    expect(screen.getByText('Typography')).toBeInTheDocument();
  });

  it('should display buttons section', () => {
    render(<ColorPalette />);
    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(screen.getByText('Primary Button')).toBeInTheDocument();
    expect(screen.getByText('Secondary Button')).toBeInTheDocument();
  });

  it('should display mobile-first breakpoints', () => {
    render(<ColorPalette />);
    expect(screen.getByText('Mobile-First Breakpoints')).toBeInTheDocument();
    expect(screen.getByText(/xs: 375px/)).toBeInTheDocument();
    expect(screen.getByText(/sm: 640px/)).toBeInTheDocument();
    expect(screen.getByText(/md: 768px/)).toBeInTheDocument();
  });

  it('should display touch target information', () => {
    render(<ColorPalette />);
    expect(screen.getByText('Touch Targets')).toBeInTheDocument();
    expect(screen.getByText('44x44px')).toBeInTheDocument();
  });
});
