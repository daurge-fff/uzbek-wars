import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReferralPanel } from './ReferralPanel';

const mockReferrals = [
  { username: 'Friend1', avatar: '👨‍💻', level: 10, registeredAt: '2024-01-15' },
  { username: 'Friend2', avatar: '👩‍🎓', level: 8, registeredAt: '2024-01-20' }
];

const mockBonus = {
  crystals: 100,
  soms: 1000
};

describe('ReferralPanel', () => {
  it('should render referral code', () => {
    render(
      <ReferralPanel
        referralCode="TEST1234"
        referralLink="https://uzbekwars.com/ref/TEST1234"
        referredFriends={[]}
        totalBonus={{ crystals: 0, soms: 0 }}
      />
    );

    expect(screen.getByText('TEST1234')).toBeInTheDocument();
  });

  it('should show referred friends count', () => {
    render(
      <ReferralPanel
        referralCode="TEST1234"
        referralLink="https://uzbekwars.com/ref/TEST1234"
        referredFriends={mockReferrals}
        totalBonus={mockBonus}
      />
    );

    expect(screen.getByText('Friend1')).toBeInTheDocument();
    expect(screen.getByText('Friend2')).toBeInTheDocument();
  });

  it('should show empty state when no referrals', () => {
    render(
      <ReferralPanel
        referralCode="TEST1234"
        referralLink="https://uzbekwars.com/ref/TEST1234"
        referredFriends={[]}
        totalBonus={{ crystals: 0, soms: 0 }}
      />
    );

    expect(screen.getByText(/invite friends/i)).toBeInTheDocument();
  });
});
