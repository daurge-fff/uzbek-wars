import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders as render } from '../test/renderWithProviders';
import { Leaderboard } from './Leaderboard';
import i18n from '../i18n';

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
      expect(screen.getByText(i18n.t('leaderboard.title'))).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Leaderboard />);
    expect(screen.getByText(i18n.t('common.loading'))).toBeInTheDocument();
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
      // Medals are rendered by the Emoji component as <img alt="<medal>">
      expect(screen.getByAltText('🥇')).toBeInTheDocument();
      expect(screen.getByAltText('🥈')).toBeInTheDocument();
    });
  });

  it('renders category buttons', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      const categoryButton = (labelKey: string) =>
        screen.getByText(i18n.t(labelKey)).closest('button')!;

      expect(within(categoryButton('leaderboard.categories.level')).getByAltText('🏆')).toBeInTheDocument();
      expect(within(categoryButton('leaderboard.categories.soms')).getByAltText('💰')).toBeInTheDocument();
      expect(within(categoryButton('leaderboard.categories.crystals')).getByAltText('💎')).toBeInTheDocument();
    });
  });
});
