/**
 * Root application component
 * 
 * Sets up routing, state management, and global providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Create React Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background-primary">
        <header className="bg-primary text-white p-4 text-center">
          <h1 className="text-2xl font-bold">Узбек Варс</h1>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-text-primary text-lg">
              Welcome to Uzbek Wars!
            </p>
            <p className="text-text-secondary mt-2">
              Mobile-first PWA game with Uzbek cultural aesthetics
            </p>
          </div>
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFF8DC',
            color: '#2C1810'
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
