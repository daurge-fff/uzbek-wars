import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';
import '../i18n';

const mockPlayers = [
  { rank: 1, userId: '1', username: 'Timur', avatar: '👨‍💼', level: 50, soms: 100000, cityName: 'Bukhara', isCurrentPlayer: false },
  { rank: 2, userId: '2', username: 'Aziza', avatar: '👩‍🍳', level: 45, soms: 85000, cityName: 'Tashkent', isCurrentPlayer: false },
  { rank: 3, userId: '3', username: 'Rustam', avatar: '👨‍🌾', level: 42, soms: 75000, cityName: 'Samarkand', isCurrentPlayer: true }
];

describe('Leaderboard', () => {
  it('renders all players', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Timur')).toBeInTheDocument();
    expect(screen.getByText('Aziza')).toBeInTheDocument();
    expect(screen.getByText('Rustam')).toBeInTheDocument();
  });

  it('shows medals for top 3', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('highlights current player', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    const currentPlayerBadge = screen.getByText(/You/i);
    expect(currentPlayerBadge).toBeInTheDocument();
  });

  it('calls onTypeChange when switching tabs', () => {
    const onTypeChange = vi.fn();
    render(
      <Leaderboard
        players={mockPlayers}
        type="global"
        onTypeChange={onTypeChange}
      />
    );

    const cityButton = screen.getByText('🏙️').closest('button');
    fireEvent.click(cityButton!);

    expect(onTypeChange).toHaveBeenCalledWith('city');
  });

  it('displays player levels', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });
});
