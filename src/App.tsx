import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFamily } from './hooks/useFamily';
import { useTransactions } from './hooks/useTransactions';
import { useIdentity } from './contexts/IdentityContext';
import { useChild } from './contexts/ChildContext';
import { AuthPage } from './pages/AuthPage';
import { FamilySetupPage } from './pages/FamilySetupPage';
import { MemberMatchPage } from './pages/MemberMatchPage';
import { IdentitySelectPage } from './pages/IdentitySelectPage';
import { ChildSelectPage } from './pages/ChildSelectPage';
import { PendingParentPage } from './pages/PendingParentPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsagePage } from './pages/UsagePage';
import { BottomNav } from './components/BottomNav';
import { WifiOff } from 'lucide-react';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { family, loading: familyLoading, getPendingParentRequests, getCurrentMember } = useFamily();
  const { pendingTransactions } = useTransactions();
  const { identity, syncFromMember: syncIdentityFromMember } = useIdentity();
  const { activeChildId, syncFromMember: syncChildFromMember } = useChild();
  const [activeTab, setActiveTab] = useState('home');
  const [addPageMemberId, setAddPageMemberId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [matchHandled, setMatchHandled] = useState(false);

  const pendingCount = (getPendingParentRequests?.()?.length || 0) + (pendingTransactions?.length || 0);

  // Check if user has a linked member (computed outside of conditionals for hooks)
  const userMember = (user && family) ? Object.values(family.members).find(
    m => m.authUserId === user.uid && !m.isPreAdded
  ) : null;

  // Online/offline status effect
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

  // Update matchHandled when user is already linked (avoiding setState during render)
  useEffect(() => {
    if (user && family && userMember && !matchHandled) {
      setMatchHandled(true);
    }
  }, [user, family, userMember, matchHandled]);

  // Auto-sync identity and childId from member data
  useEffect(() => {
    if (userMember) {
      // Sync identity from member's displayName
      syncIdentityFromMember(userMember.displayName);

      // For kids, auto-sync their childId so they don't need to select
      if (userMember.role === 'kid' && userMember.childId) {
        syncChildFromMember(userMember.childId);
      }
    }
  }, [userMember, syncIdentityFromMember, syncChildFromMember]);

  // Loading state
  if (authLoading || (user && familyLoading)) {
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

  if (!family) {
    return <FamilySetupPage />;
  }

  // If user doesn't have a linked member yet, show match page
  if (!matchHandled && !userMember) {
    return <MemberMatchPage onMatchHandled={() => setMatchHandled(true)} />;
  }

  if (!identity) {
    return <IdentitySelectPage />;
  }

  // Check if user is a pending parent (needs approval)
  const currentMember = getCurrentMember();
  if (currentMember?.role === 'parent' && currentMember?.status === 'pending') {
    return <PendingParentPage />;
  }

  if (!activeChildId) {
    return <ChildSelectPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardPage onNavigate={(tab, memberId) => {
          if (memberId) setAddPageMemberId(memberId);
          setActiveTab(tab);
        }} />;
      case 'usage':
        return <UsagePage />;
      case 'add':
        return <AddTransactionPage preSelectedMemberId={addPageMemberId} onMemberUsed={() => setAddPageMemberId(null)} />;
      case 'approvals':
        return <ApprovalsPage />;
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
      <BottomNav activeTab={activeTab} onNavigate={setActiveTab} pendingCount={pendingCount} />
    </div>
  );
}

export default App;
