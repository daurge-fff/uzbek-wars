import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';
import '../i18n';

// Mock fetch
global.fetch = vi.fn();

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          leaderboard: [
            {
              rank: 1,
              player: {
                id: '1',
                displayName: 'Timur',
                level: 50,
                soms: 100000,
                cityId: 'bukhara',
                characterId: 'merchant'
              }
            },
            {
              rank: 2,
              player: {
                id: '2',
                displayName: 'Aziza',
                level: 45,
                soms: 85000,
                cityId: 'tashkent',
                characterId: 'warrior'
              }
            }
          ],
          playerRank: null,
          total: 2
        }
      })
    });
  });

  it('renders leaderboard title', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Рейтинги/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Загрузка/i)).toBeInTheDocument();
  });

  it('displays players after loading', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Timur')).toBeInTheDocument();
      expect(screen.getByText('Aziza')).toBeInTheDocument();
    });
  });

  it('shows medals for top 3', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
    });
  });

  it('renders category buttons', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('💰')).toBeInTheDocument();
      expect(screen.getByText('💎')).toBeInTheDocument();
    });
  });
});
