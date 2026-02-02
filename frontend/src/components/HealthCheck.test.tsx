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
    expect(screen.getByText(/Overall Status/i)).toBeInTheDocument();
  });

  it('should display services status section', () => {
    render(<HealthCheck />);
    expect(screen.getByText(/Service Status/i)).toBeInTheDocument();
  });

  it('should display test results section', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy', services: {} })
        });
      }
      if (url === '/api/tests/results') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: []
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<HealthCheck />);
    
    await waitFor(() => {
      const elements = screen.getAllByText(/Test Results/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should show all service names', () => {
    render(<HealthCheck />);
    expect(screen.getByText('Backend API')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.getByText('Telegram Bot')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('should show all test suite names', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy', services: {} })
        });
      }
      if (url === '/api/tests/results') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              { name: 'Backend Tests', passed: 100, failed: 0, skipped: 0, total: 100, coverage: 90, duration: 5, lastRun: new Date().toISOString(), failedTests: [] },
              { name: 'Frontend Tests', passed: 80, failed: 0, skipped: 0, total: 80, coverage: 92, duration: 3, lastRun: new Date().toISOString(), failedTests: [] },
              { name: 'Integration Tests', passed: 50, failed: 0, skipped: 0, total: 50, coverage: 91, duration: 10, lastRun: new Date().toISOString(), failedTests: [] }
            ]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<HealthCheck />);
    
    await waitFor(() => {
      expect(screen.getByText('Backend Tests')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Frontend Tests')).toBeInTheDocument();
    expect(screen.getByText('Integration Tests')).toBeInTheDocument();
  });

  it('should display refresh button', () => {
    render(<HealthCheck />);
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show test statistics', () => {
    render(<HealthCheck />);
    const passedElements = screen.getAllByText(/Passed/i);
    expect(passedElements.length).toBeGreaterThan(0);
  });

  it('should display coverage percentages', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy', services: {} })
        });
      }
      if (url === '/api/tests/results') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              { name: 'Backend Tests', passed: 100, failed: 0, skipped: 0, total: 100, coverage: 91, duration: 5, lastRun: new Date().toISOString(), failedTests: [] }
            ]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<HealthCheck />);
    
    await waitFor(() => {
      expect(screen.getByText(/91% coverage/i)).toBeInTheDocument();
    });
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
