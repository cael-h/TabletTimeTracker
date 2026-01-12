import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { useFamily } from '../hooks/useFamily';
import { Plus, Minus, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { approvedTransactions, loading } = useTransactions();
  const { settings } = useSettings();
  const { family } = useFamily();
  const [showKids, setShowKids] = useState(true);
  const [showParents, setShowParents] = useState(true);

  const recentTransactions = approvedTransactions.slice(0, 3);

  const formatMinutes = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatAmount = (amount: number, unit: 'minutes' | 'points') => {
    if (unit === 'points') {
      return `${Math.abs(amount)} pts`;
    }
    return formatMinutes(amount);
  };

  const getPersonInfo = (childId: string) => {
    // First try to find the member in family.members by childId
    if (family) {
      const member = Object.values(family.members).find((m) => m.childId === childId);
      if (member) {
        return {
          name: member.displayName,
          color: member.color || '#6b7280',
        };
      }
    }

    // Fallback to settings.children for backward compatibility
    const person = settings?.children.find((c) => c.id === childId);
    return {
      name: person?.name || 'Unknown',
      color: person?.color || '#6b7280',
    };
  };

  // Calculate balances for each family member
  const memberBalances = useMemo(() => {
    if (!family) return { kids: [], parents: [] };

    const balanceMap = new Map<string, { member: any; balance: number; unit: 'minutes' | 'points' }>();

    // Initialize all family members with 0 balance (including pre-added ones)
    Object.values(family.members).forEach((member) => {
      if (member.childId) {
        const unit = member.role === 'kid' ? 'minutes' : 'points';
        balanceMap.set(member.id, { member, balance: 0, unit });
      }
    });

    // Calculate balances from approved transactions
    approvedTransactions.forEach((txn) => {
      // Find the member that owns this childId
      const member = Object.values(family.members).find(
        m => m.childId === txn.childId
      );

      if (member && balanceMap.has(member.id)) {
        const current = balanceMap.get(member.id)!;
        balanceMap.set(member.id, {
          ...current,
          balance: current.balance + txn.amount,
        });
      }
    });

    // Separate into kids and parents
    const kids: any[] = [];
    const parents: any[] = [];

    balanceMap.forEach((data) => {
      if (data.member.role === 'kid') {
        kids.push(data);
      } else if (data.member.role === 'parent') {
        parents.push(data);
      }
    });

    // Sort by name
    kids.sort((a, b) => a.member.displayName.localeCompare(b.member.displayName));
    parents.sort((a, b) => a.member.displayName.localeCompare(b.member.displayName));

    return { kids, parents };
  }, [family, approvedTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Clock size={48} className="animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Family Members Overview */}
      <div className="space-y-4">
        {/* Kids Section */}
        {memberBalances.kids.length > 0 && (
          <div className="card">
            <button
              onClick={() => setShowKids(!showKids)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kids</h2>
              {showKids ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showKids && (
              <div className="space-y-2">
                {memberBalances.kids.map((item) => (
                  <div
                    key={item.member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.member.color && (
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: item.member.color }}
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.member.displayName}
                      </span>
                    </div>
                    <span
                      className={`text-lg font-semibold ${
                        item.balance >= 0
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {formatAmount(item.balance, item.unit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parents Section */}
        {memberBalances.parents.length > 0 && (
          <div className="card">
            <button
              onClick={() => setShowParents(!showParents)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Parents</h2>
              {showParents ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showParents && (
              <div className="space-y-2">
                {memberBalances.parents.map((item) => (
                  <div
                    key={item.member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.member.color && (
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: item.member.color }}
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.member.displayName}
                      </span>
                    </div>
                    <span
                      className={`text-lg font-semibold ${
                        item.balance >= 0
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {formatAmount(item.balance, item.unit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('add')}
          className="btn-primary py-8 flex flex-col items-center gap-2"
        >
          <TrendingUp size={32} />
          <span className="text-lg font-semibold">Add Activity</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className="btn-secondary py-8 flex flex-col items-center gap-2"
        >
          <Clock size={32} />
          <span className="text-lg font-semibold">View History</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button
            onClick={() => onNavigate('history')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View All
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock size={48} className="mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Start by earning or spending minutes!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((txn) => {
              const personInfo = getPersonInfo(txn.childId);
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.amount > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500'
                      }`}
                    >
                      {txn.amount > 0 ? <Plus size={20} /> : <Minus size={20} />}
                    </div>
                    <div>
                      <p className="font-medium">{txn.reason}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span style={{ color: personInfo.color }} className="font-semibold">
                          {personInfo.name}
                        </span>{' '}
                        • {txn.user} • {formatDistanceToNow(txn.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      txn.amount > 0
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500'
                    }`}
                  >
                    {txn.amount > 0 ? '+' : ''}
                    {formatAmount(txn.amount, txn.unit)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
