import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../test/renderWithProviders';
import { GameDashboard } from './GameDashboard';
import i18n from '../i18n';

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
    
    expect(screen.getByText(`${i18n.t('dashboard.level')} ${mockPlayerState.level}`)).toBeDefined();
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
    
    // Experience is rendered as progress towards the next level.
    const expectedPercent = `${Math.round(
      (mockPlayerState.experience / mockPlayerState.experienceToNextLevel) * 100
    )}%`;
    expect(screen.getByText(expectedPercent)).toBeDefined();
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
    
    expect(screen.getByText(mockPlayerState.soms.toLocaleString())).toBeDefined();
  });
});
