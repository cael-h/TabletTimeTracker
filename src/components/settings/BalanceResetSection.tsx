import { useState, type FC } from 'react';
import { RotateCcw } from 'lucide-react';
import type { FamilyMember, TransactionUnit } from '../../types';
import { formatAmount } from '../../utils/format';

interface BalanceResetSectionProps {
  members: FamilyMember[];
  getBalance: (childId: string) => number;
  onResetBalance: (childId: string, balance: number, unit: TransactionUnit) => Promise<void>;
}

export const BalanceResetSection: FC<BalanceResetSectionProps> = ({
  members, getBalance, onResetBalance,
}) => {
  const [resetting, setResetting] = useState(false);

  const membersWithBalances = members
    .filter(m => m.childId)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const handleReset = async (childId: string, balance: number, unit: TransactionUnit) => {
    const confirmed = confirm(
      `Reset this balance to 0? Current: ${formatAmount(balance, unit)}. This will create an adjustment transaction.`
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      await onResetBalance(childId, balance, unit);
      alert('Balance reset successfully!');
    } catch (error) {
      console.error('Error resetting balance:', error);
      alert('Failed to reset balance');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">Reset Balance</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Create an adjustment transaction to set a member's balance to 0.
      </p>
      <div className="space-y-2">
        {membersWithBalances.map(member => {
          const memberBalance = getBalance(member.childId!);
          const memberUnit: TransactionUnit = member.role === 'kid' ? 'minutes' : 'points';
          return (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{member.displayName}</span>
                <span className={`ml-2 text-sm ${memberBalance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {formatAmount(memberBalance, memberUnit)}
                </span>
              </div>
              <button
                onClick={() => handleReset(member.childId!, memberBalance, memberUnit)}
                disabled={resetting || memberBalance === 0}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
