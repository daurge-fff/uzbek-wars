import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Emoji from './Emoji';

describe('Emoji Component', () => {
  it('renders emoji image with correct src', () => {
    render(<Emoji emoji="🎮" size={24} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src');
    expect(img.getAttribute('src')).toContain('emojicdn.elk.sh');
    expect(img.getAttribute('src')).toContain('🎮');
  });

  it('renders with default size of 24', () => {
    render(<Emoji emoji="💎" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '24');
    expect(img).toHaveAttribute('height', '24');
  });

  it('renders with custom size', () => {
    render(<Emoji emoji="🏆" size={48} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
  });

  it('uses apple style by default', () => {
    render(<Emoji emoji="⚡" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('style=apple');
  });

  it('supports custom style', () => {
    render(<Emoji emoji="😊" style="google" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('style=google');
  });

  it('applies custom className', () => {
    render(<Emoji emoji="⚡" className="custom-class" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('has correct alt text', () => {
    render(<Emoji emoji="🎯" />);
    const img = screen.getByAltText('🎯');
    expect(img).toBeInTheDocument();
  });

  it('has lazy loading enabled', () => {
    render(<Emoji emoji="💰" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('handles complex emojis correctly', () => {
    render(<Emoji emoji="👨‍💻" size={32} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('emojicdn.elk.sh');
    expect(img.getAttribute('src')).toContain('👨‍💻');
  });

  it('memoizes and does not re-render with same props', () => {
    const { rerender } = render(<Emoji emoji="🎮" size={24} />);
    const img1 = screen.getByRole('img');
    
    rerender(<Emoji emoji="🎮" size={24} />);
    const img2 = screen.getByRole('img');
    
    expect(img1).toBe(img2);
  });
});
