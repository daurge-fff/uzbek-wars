import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; defaults to a friendly reload screen */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches render-time crashes so a single broken screen can't white-screen the whole
 * mini app. Shows a friendly recovery screen with a reload button.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App crashed:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-black dark:via-black dark:to-black p-6">
        <div className="max-w-sm w-full text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Упс, что-то сломалось
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Попробуйте обновить страницу. Если не поможет — закройте и откройте приложение заново.
          </p>
          <div className="space-y-2">
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold"
            >
              Обновить
            </button>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold border border-gray-200 dark:border-gray-700"
            >
              Продолжить
            </button>
          </div>
        </div>
      </div>
    );
  }
}
