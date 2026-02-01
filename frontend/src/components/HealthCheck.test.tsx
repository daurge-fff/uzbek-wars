/**
 * HealthCheck Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { HealthCheck } from './HealthCheck';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('HealthCheck Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render health check title', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Health Check/i)).toBeInTheDocument();
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
    expect(screen.getByText('Backend Unit Tests')).toBeInTheDocument();
    expect(screen.getByText('Backend Integration Tests')).toBeInTheDocument();
    expect(screen.getByText('Frontend Component Tests')).toBeInTheDocument();
    expect(screen.getByText('Property-Based Tests')).toBeInTheDocument();
  });

  it('should display refresh button', () => {
    render(<HealthCheck />);
    const refreshButton = screen.getByRole('button', { name: /Обновить/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show test statistics', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Пройдено/i)).toBeInTheDocument();
    expect(screen.getByText(/Провалено/i)).toBeInTheDocument();
    expect(screen.getByText(/Пропущено/i)).toBeInTheDocument();
    expect(screen.getByText(/Всего/i)).toBeInTheDocument();
  });

  it('should display coverage percentages', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/87% покрытие/i)).toBeInTheDocument();
    expect(screen.getByText(/92% покрытие/i)).toBeInTheDocument();
    expect(screen.getByText(/85% покрытие/i)).toBeInTheDocument();
    expect(screen.getByText(/95% покрытие/i)).toBeInTheDocument();
  });

  it('should show success message when all tests pass', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Все системы работают отлично!/i)).toBeInTheDocument();
  });

  it('should call health API on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' })
    });

    render(<HealthCheck />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/health');
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<HealthCheck />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Component should still render
    expect(screen.getByText(/Health Check/i)).toBeInTheDocument();
  });
});
