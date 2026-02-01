import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';
import '../i18n';

const mockPlayers = [
  { rank: 1, userId: '1', username: 'Тимур', avatar: '👨‍💼', level: 50, soms: 100000, cityName: 'Бухара', isCurrentPlayer: false },
  { rank: 2, userId: '2', username: 'Азиза', avatar: '👩‍🍳', level: 45, soms: 85000, cityName: 'Ташкент', isCurrentPlayer: false },
  { rank: 3, userId: '3', username: 'Рустам', avatar: '👨‍🌾', level: 42, soms: 75000, cityName: 'Самарканд', isCurrentPlayer: true }
];

describe('Leaderboard', () => {
  it('renders all players', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        currentPlayerId="3"
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Тимур')).toBeInTheDocument();
    expect(screen.getByText('Азиза')).toBeInTheDocument();
    expect(screen.getByText('Рустам')).toBeInTheDocument();
  });

  it('shows medals for top 3', () => {
    render(
      <Leaderboard
        players={mockPlayers}
        currentPlayerId="3"
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('highlights current player', () => {
    const { container } = render(
      <Leaderboard
        players={mockPlayers}
        currentPlayerId="3"
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    const currentPlayerBadge = screen.getByText(/Вы/i);
    expect(currentPlayerBadge).toBeInTheDocument();
  });

  it('calls onTypeChange when switching tabs', () => {
    const onTypeChange = vi.fn();
    render(
      <Leaderboard
        players={mockPlayers}
        currentPlayerId="3"
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
        currentPlayerId="3"
        type="global"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Ур.50')).toBeInTheDocument();
    expect(screen.getByText('Ур.45')).toBeInTheDocument();
  });
});
