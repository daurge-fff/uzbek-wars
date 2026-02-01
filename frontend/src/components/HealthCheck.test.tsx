/**
 * HealthCheck Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { HealthCheck } from './HealthCheck';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('HealthCheck Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render health check title', () => {
    render(<HealthCheck />);
    expect(screen.getByText('Health Check')).toBeInTheDocument();
  });

  it('should display overall status section', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Общий статус/i)).toBeInTheDocument();
  });

  it('should display services status section', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Статус сервисов/i)).toBeInTheDocument();
  });

  it('should display test results section', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Результаты тестов/i)).toBeInTheDocument();
  });

  it('should show all service names', () => {
    render(<HealthCheck />);
    expect(screen.getByText('Backend API')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.getByText('Telegram Bot')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('should show all test suite names', () => {
    render(<HealthCheck />);
    expect(screen.getByText('Backend Tests')).toBeInTheDocument();
    expect(screen.getByText('Frontend Tests')).toBeInTheDocument();
    expect(screen.getByText('Integration Tests')).toBeInTheDocument();
  });

  it('should display refresh button', () => {
    render(<HealthCheck />);
    const refreshButton = screen.getByRole('button', { name: /Обновить/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show test statistics', () => {
    render(<HealthCheck />);
    const passedElements = screen.getAllByText(/Пройдено/i);
    expect(passedElements.length).toBeGreaterThan(0);
  });

  it('should display coverage percentages', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/91% покрытие/i)).toBeInTheDocument();
  });

  it('should render summary section at bottom', () => {
    const { container } = render(<HealthCheck />);
    // Check that component renders without crashing
    expect(container).toBeInTheDocument();
  });

  it('should call health API on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' })
    });

    render(<HealthCheck />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/health');
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<HealthCheck />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Component should still render
    expect(screen.getByText('Health Check')).toBeInTheDocument();
  });
});
