import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameDashboard } from './GameDashboard';

const mockPlayerState = {
  characterId: 'char1',
  cityId: 'samarkand',
  level: 5,
  experience: 450,
  experienceToNextLevel: 506,
  soms: 1250,
  donationCurrency: 50,
  stats: {
    hunger: 75,
    health: 90,
    mood: 60,
    energy: 80
  }
};

const mockActivities = [
  { id: 'work', name: 'Работать', icon: '💼' },
  { id: 'rob', name: 'Грабить', icon: '🔫' }
];

describe('GameDashboard', () => {
  it('displays player level', () => {
    const onActivitySelect = vi.fn();
    render(
      <GameDashboard
        playerState={mockPlayerState}
        activities={mockActivities}
        onActivitySelect={onActivitySelect}
      />
    );
    
    expect(screen.getByText('5')).toBeDefined();
  });

  it('displays player experience', () => {
    const onActivitySelect = vi.fn();
    render(
      <GameDashboard
        playerState={mockPlayerState}
        activities={mockActivities}
        onActivitySelect={onActivitySelect}
      />
    );
    
    expect(screen.getByText(/450\/506/)).toBeDefined();
  });

  it('displays soms amount', () => {
    const onActivitySelect = vi.fn();
    render(
      <GameDashboard
        playerState={mockPlayerState}
        activities={mockActivities}
        onActivitySelect={onActivitySelect}
      />
    );
    
    expect(screen.getByText(/1250/)).toBeDefined();
  });
});
