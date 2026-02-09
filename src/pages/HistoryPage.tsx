import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { useFamily } from '../hooks/useFamily';
import { Plus, Minus, Trash2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { formatAmount, getPersonInfo } from '../utils/format';
import type { Transaction, TransactionUnit, FamilyMember } from '../types';

interface GroupedTransactions {
  date: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

export const HistoryPage: FC = () => {
  const { transactions, deleteTransaction, loading, getBalance } = useTransactions();
  const { settings } = useSettings();
  const { family } = useFamily();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);

  // Build list of members with childIds for the filter
  const filterableMembers: FamilyMember[] = useMemo(
    () => family ? Object.values(family.members).filter(m => m.childId).sort((a, b) => a.displayName.localeCompare(b.displayName)) : [],
    [family],
  );

  const filterMember = filterableMembers.find(m => m.id === filterMemberId) ?? null;

  // Filter transactions by selected member
  const filteredTransactions = useMemo(
    () => filterMember ? transactions.filter(t => t.childId === filterMember.childId) : transactions,
    [transactions, filterMember],
  );

  // Filtered balance and unit
  const filteredBalance = filterMember ? getBalance(filterMember.childId!) : null;
  const filteredUnit: TransactionUnit | null = filterMember ? (filterMember.role === 'kid' ? 'minutes' : 'points') : null;

  // Group transactions by day
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions[] = [];
    let currentGroup: GroupedTransactions | null = null;

    filteredTransactions.forEach((txn) => {
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
  }, [filteredTransactions]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
            <AlertCircle size={12} />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
            <XCircle size={12} />
            Rejected
          </span>
        );
      case 'approved':
      default:
        return null; // Don't show badge for approved transactions
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
      {/* Member Filter + Balance Header */}
      <div className="card mb-4 sticky top-0 z-10 space-y-3">
        {/* Member filter chips */}
        {filterableMembers.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMemberId(null)}
              className={`chip text-sm ${filterMemberId === null ? 'chip-selected' : ''}`}
            >
              All
            </button>
            {filterableMembers.map(m => (
              <button
                key={m.id}
                onClick={() => setFilterMemberId(m.id)}
                className={`chip text-sm ${filterMemberId === m.id ? 'chip-selected' : ''}`}
              >
                {m.displayName}
              </button>
            ))}
          </div>
        )}

        {/* Balance — only shown when a specific member is selected */}
        {filteredBalance !== null && filteredUnit !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filterMember?.displayName}'s Balance
            </span>
            <span
              className={`text-2xl font-bold ${
                filteredBalance >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              {formatAmount(filteredBalance, filteredUnit)}
            </span>
          </div>
        )}
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
                {filteredUnit && (
                  <span
                    className={`text-sm font-medium ${
                      group.dailyTotal >= 0
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500'
                    }`}
                  >
                    {group.dailyTotal > 0 ? '+' : ''}
                    {formatAmount(group.dailyTotal, filteredUnit)}
                  </span>
                )}
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                {group.transactions.map((txn) => {
                  const personInfo = getPersonInfo(txn.childId, family, settings);
                  return (
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
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{txn.reason}</p>
                            {getStatusBadge(txn.status)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span style={{ color: personInfo.color }} className="font-semibold">
                              {personInfo.name}
                            </span>{' '}
                            • {txn.user} • {format(txn.timestamp, 'h:mm a')}
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
                          {formatAmount(txn.amount, txn.unit)}
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
