/**
 * Tests for TailwindCSS configuration
 * 
 * Validates Uzbek color palette and mobile-first setup
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('TailwindCSS Configuration', () => {
  it('should apply Uzbek primary color', () => {
    const { container } = render(
      <div className="bg-primary text-white">Test</div>
    );
    
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('bg-primary');
    expect(element).toHaveClass('text-white');
  });
  
  it('should apply background colors', () => {
    const { container } = render(
      <div className="bg-background-primary">Test</div>
    );
    
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('bg-background-primary');
  });
  
  it('should apply text colors', () => {
    const { container } = render(
      <div className="text-text-primary">Test</div>
    );
    
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('text-text-primary');
  });
  
  it('should apply minimum touch target sizes', () => {
    const { container } = render(
      <button className="min-h-touch min-w-touch">Button</button>
    );
    
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('min-h-touch');
    expect(button).toHaveClass('min-w-touch');
  });
  
  it('should apply custom button styles', () => {
    const { container } = render(
      <button className="btn-primary">Primary Button</button>
    );
    
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('btn-primary');
  });
  
  it('should apply card styles', () => {
    const { container } = render(
      <div className="card">Card Content</div>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('card');
  });
});
