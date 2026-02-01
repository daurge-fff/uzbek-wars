import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CosmeticShop } from './CosmeticShop';
import '../i18n';

const mockItems = [
  { id: '1', name: 'Тюбетейка', type: 'clothing' as const, rarity: 'common' as const, price: 50, icon: '🎩', owned: false, equipped: false },
  { id: '2', name: 'Золотая корона', type: 'clothing' as const, rarity: 'legendary' as const, price: 500, icon: '👑', owned: false, equipped: false },
  { id: '3', name: 'Регистан', type: 'background' as const, rarity: 'epic' as const, price: 200, icon: '🕌', owned: true, equipped: true }
];

describe('CosmeticShop', () => {
  it('renders all cosmetic items', () => {
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={1000}
        onPurchase={vi.fn()}
        onEquip={vi.fn()}
      />
    );

    expect(screen.getByText('Тюбетейка')).toBeInTheDocument();
    expect(screen.getByText('Золотая корона')).toBeInTheDocument();
    expect(screen.getByText('Регистан')).toBeInTheDocument();
  });

  it('shows player crystals', () => {
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={1000}
        onPurchase={vi.fn()}
        onEquip={vi.fn()}
      />
    );

    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('filters items by type', () => {
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={1000}
        onPurchase={vi.fn()}
        onEquip={vi.fn()}
      />
    );

    const backgroundFilter = screen.getByText('Фоны');
    fireEvent.click(backgroundFilter);

    expect(screen.getByText('Регистан')).toBeInTheDocument();
    expect(screen.queryByText('Тюбетейка')).not.toBeInTheDocument();
  });

  it('calls onPurchase when buying item', () => {
    const onPurchase = vi.fn();
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={1000}
        onPurchase={onPurchase}
        onEquip={vi.fn()}
      />
    );

    const purchaseButton = screen.getAllByText('💎 50')[0].closest('button');
    fireEvent.click(purchaseButton!);

    expect(onPurchase).toHaveBeenCalledWith('1');
  });

  it('disables purchase button when not enough crystals', () => {
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={10}
        onPurchase={vi.fn()}
        onEquip={vi.fn()}
      />
    );

    const purchaseButton = screen.getAllByText('💎 50')[0].closest('button');
    expect(purchaseButton).toBeDisabled();
  });

  it('shows equip button for owned items', () => {
    render(
      <CosmeticShop
        items={mockItems}
        playerCrystals={1000}
        onPurchase={vi.fn()}
        onEquip={vi.fn()}
      />
    );

    expect(screen.getByText(/Надето/i)).toBeInTheDocument();
  });
});
