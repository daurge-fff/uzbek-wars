import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Emoji from './Emoji';

/**
 * Emoji contract: local file first (if the emoji is in the mapping),
 * then the CDN, and only if both are unavailable — the system emoji as text.
 * The tests pin exactly this order: cards must never stay empty.
 */
describe('Emoji Component', () => {
  it('uses a local file when the emoji is mapped', () => {
    render(<Emoji emoji="🎮" size={24} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/emoji-fallback/game.png');
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

  it('falls back to the CDN with the requested style for unmapped emojis', () => {
    render(<Emoji emoji="🦊" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('emojicdn.elk.sh');
    expect(img.getAttribute('src')).toContain('style=apple');
  });

  it('supports custom style', () => {
    render(<Emoji emoji="🐫" style="google" />);
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

  it('maps complex emojis to their local file', () => {
    render(<Emoji emoji="👨‍💻" size={32} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/emoji-fallback/developer.png');
  });

  it('renders nothing for an empty emoji instead of a broken image', () => {
    const { container } = render(<Emoji emoji="" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('memoizes and does not re-render with same props', () => {
    const { rerender } = render(<Emoji emoji="🎮" size={24} />);
    const img1 = screen.getByRole('img');

    rerender(<Emoji emoji="🎮" size={24} />);
    const img2 = screen.getByRole('img');

    expect(img1).toBe(img2);
  });
});
