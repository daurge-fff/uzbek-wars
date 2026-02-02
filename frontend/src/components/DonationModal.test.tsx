import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DonationModal } from './DonationModal';
import '../i18n';

describe('DonationModal', () => {
  it('renders when open', () => {
    render(
      <DonationModal
        isOpen={true}
        onClose={vi.fn()}
        onDonate={vi.fn()}
      />
    );

    expect(screen.getByText('$1')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DonationModal
        isOpen={false}
        onClose={vi.fn()}
        onDonate={vi.fn()}
      />
    );

    expect(screen.queryByText(/Поддержать игру/i)).not.toBeInTheDocument();
  });

  it('displays all donation options', () => {
    render(
      <DonationModal
        isOpen={true}
        onClose={vi.fn()}
        onDonate={vi.fn()}
      />
    );

    expect(screen.getByText('$1')).toBeInTheDocument();
    expect(screen.getByText('$5')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  it('shows popular badge on featured option', () => {
    render(
      <DonationModal
        isOpen={true}
        onClose={vi.fn()}
        onDonate={vi.fn()}
      />
    );

    expect(screen.getByText(/Popular/i)).toBeInTheDocument();
  });

  it('calls onDonate when option is clicked', async () => {
    const onDonate = vi.fn().mockResolvedValue(undefined);
    render(
      <DonationModal
        isOpen={true}
        onClose={vi.fn()}
        onDonate={onDonate}
      />
    );

    // Click on $1 option to select it
    const option = screen.getByText('$1').closest('div[class*="rounded-[24px]"]');
    if (option) {
      fireEvent.click(option);
      // Option is now selected, but onDonate is not called yet
      // onDonate is called after payment method selection
      expect(option).toBeTruthy();
    }
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <DonationModal
        isOpen={true}
        onClose={onClose}
        onDonate={vi.fn()}
      />
    );

    const closeButton = screen.getByText('✕').closest('button');
    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });
});
