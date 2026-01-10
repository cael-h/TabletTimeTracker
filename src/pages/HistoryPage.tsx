import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Plus, Minus, Trash2, Clock } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import type { Transaction } from '../types';

interface GroupedTransactions {
  date: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

export const HistoryPage: React.FC = () => {
  const { transactions, deleteTransaction, loading, balance } = useTransactions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group transactions by day
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions[] = [];
    let currentGroup: GroupedTransactions | null = null;

    transactions.forEach((txn) => {
      if (!currentGroup || !isSameDay(currentGroup.date, txn.timestamp)) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          date: txn.timestamp,
          transactions: [txn],
          dailyTotal: txn.amount,
        };
      } else {
        currentGroup.transactions.push(txn);
        currentGroup.dailyTotal += txn.amount;
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [transactions]);

  const formatMinutes = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleDelete = async (txn: Transaction) => {
    if (!confirm(`Delete "${txn.reason}" transaction?`)) return;

    setDeletingId(txn.id);
    try {
      await deleteTransaction(txn.id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
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
    <div className="p-4 pb-24">
      {/* Running Balance Header */}
      <div className="card mb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Running Balance</span>
          <span
            className={`text-2xl font-bold ${
              balance >= 0
                ? 'text-green-600 dark:text-green-500'
                : 'text-red-600 dark:text-red-500'
            }`}
          >
            {formatMinutes(balance)}
          </span>
        </div>
      </div>

      {groupedTransactions.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={64} className="mx-auto mb-4 opacity-50 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start by adding earned or spent minutes!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  {format(group.date, 'EEE, MMM d, yyyy')}
                </h3>
                <span
                  className={`text-sm font-medium ${
                    group.dailyTotal >= 0
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}
                >
                  {group.dailyTotal > 0 ? '+' : ''}
                  {formatMinutes(group.dailyTotal)}
                </span>
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                {group.transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="card flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          txn.amount > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500'
                        }`}
                      >
                        {txn.amount > 0 ? <Plus size={20} /> : <Minus size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{txn.reason}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {txn.user} • {format(txn.timestamp, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-semibold ${
                          txn.amount > 0
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}
                      >
                        {txn.amount > 0 ? '+' : ''}
                        {formatMinutes(txn.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(txn)}
                        disabled={deletingId === txn.id}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
