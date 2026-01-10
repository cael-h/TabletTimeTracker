import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Plus, Minus, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { transactions, balance, loading } = useTransactions();

  const recentTransactions = transactions.slice(0, 3);

  const formatMinutes = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

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
      {/* Balance Card */}
      <div className="card text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Balance</p>
        <div
          className={`text-6xl font-bold mb-4 ${
            balance >= 0
              ? 'text-green-600 dark:text-green-500'
              : 'text-red-600 dark:text-red-500'
          }`}
        >
          {formatMinutes(balance)}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {balance >= 0 ? 'Minutes available' : 'Minutes overdrawn'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('add')}
          className="btn-primary py-8 flex flex-col items-center gap-2"
        >
          <TrendingUp size={32} />
          <span className="text-lg font-semibold">Earn Minutes</span>
        </button>
        <button
          onClick={() => onNavigate('add')}
          className="btn-secondary py-8 flex flex-col items-center gap-2"
        >
          <TrendingDown size={32} />
          <span className="text-lg font-semibold">Spend Minutes</span>
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
            {recentTransactions.map((txn) => (
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
                      {txn.user} • {formatDistanceToNow(txn.timestamp, { addSuffix: true })}
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
                  {formatMinutes(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
