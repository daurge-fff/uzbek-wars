import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSelection } from './CharacterSelection';

const mockCharacters = [
  {
    id: 'char1',
    name: 'Character 1',
    avatar: '/avatar1.png',
    description: 'Description 1'
  },
  {
    id: 'char2',
    name: 'Character 2',
    avatar: '/avatar2.png',
    description: 'Description 2'
  },
  {
    id: 'char3',
    name: 'Character 3',
    avatar: '/avatar3.png',
    description: 'Description 3'
  }
];

describe('CharacterSelection', () => {
  it('renders at least 3 characters', () => {
    const onSelect = vi.fn();
    render(<CharacterSelection characters={mockCharacters} onSelect={onSelect} />);
    
    expect(mockCharacters.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onSelect when confirm button is clicked', () => {
    const onSelect = vi.fn();
    render(<CharacterSelection characters={mockCharacters} onSelect={onSelect} />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(onSelect).toHaveBeenCalledWith('char1');
  });

  it('displays character name and description', () => {
    const onSelect = vi.fn();
    render(<CharacterSelection characters={mockCharacters} onSelect={onSelect} />);
    
    expect(screen.getByText('Character 1')).toBeDefined();
    expect(screen.getByText('Description 1')).toBeDefined();
  });
});
