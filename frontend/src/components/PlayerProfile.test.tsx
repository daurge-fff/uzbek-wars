import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerProfile } from './PlayerProfile';

const mockPlayerInfo = {
  username: 'TestPlayer',
  avatar: '👨‍🌾',
  characterName: 'Farmer',
  cityName: 'Samarkand',
  joinedDate: '2024-01-01',
  referralCode: 'TEST1234'
};

const mockStats = {
  level: 5,
  experience: 450,
  experienceToNextLevel: 500,
  soms: 1000,
  crystals: 50,
  totalActivities: 100,
  daysPlayed: 10,
  achievements: 5
};

describe('PlayerProfile', () => {
  it('should render player information', () => {
    render(
      <PlayerProfile
        playerInfo={mockPlayerInfo}
        stats={mockStats}
        onEditProfile={vi.fn()}
      />
    );

    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('Farmer')).toBeInTheDocument();
  });

  it('should show referral code', () => {
    render(
      <PlayerProfile
        playerInfo={mockPlayerInfo}
        stats={mockStats}
        onEditProfile={vi.fn()}
      />
    );

    expect(screen.getByText('TEST1234')).toBeInTheDocument();
  });

  it('should show verification button when not verified', () => {
    render(
      <PlayerProfile
        playerInfo={mockPlayerInfo}
        stats={mockStats}
        onEditProfile={vi.fn()}
        isVerified={false}
      />
    );

    expect(screen.getByText(/verify/i)).toBeInTheDocument();
  });

  it('should show verified status when verified', () => {
    render(
      <PlayerProfile
        playerInfo={mockPlayerInfo}
        stats={mockStats}
        onEditProfile={vi.fn()}
        isVerified={true}
      />
    );

    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });
});
