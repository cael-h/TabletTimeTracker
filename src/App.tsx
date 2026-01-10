import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useIdentity } from './contexts/IdentityContext';
import { AuthPage } from './pages/AuthPage';
import { IdentitySelectPage } from './pages/IdentitySelectPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { BottomNav } from './components/BottomNav';
import { WifiOff } from 'lucide-react';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { identity } = useIdentity();
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!identity) {
    return <IdentitySelectPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'add':
        return <AddTransactionPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <WifiOff size={16} />
          <span>Offline - Changes will sync when connection is restored</span>
        </div>
      )}

      {/* Page Content */}
      <main className="max-w-2xl mx-auto">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}

export default App;
