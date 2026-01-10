import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { useIdentity } from '../contexts/IdentityContext';
import { useChild } from '../contexts/ChildContext';
import { TrendingUp, TrendingDown, Calendar, Plus, Check } from 'lucide-react';
import type { TransactionInput } from '../types';

const QUICK_AMOUNTS = [3, 5, 10, 15, 30, 60];

export const AddTransactionPage: React.FC = () => {
  const [mode, setMode] = useState<'earn' | 'spend'>('earn');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [dateOverride, setDateOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { addTransaction } = useTransactions();
  const { settings } = useSettings();
  const { identity } = useIdentity();
  const { activeChildId } = useChild();

  const reasons = mode === 'earn' ? settings?.rewardReasons || [] : settings?.redemptionReasons || [];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleReasonSelect = (reason: string) => {
    if (reason === 'Other') {
      setSelectedReason('Other');
    } else {
      setSelectedReason(reason);
      setCustomReason('');
    }
  };

  const getAmount = () => {
    if (customAmount) {
      return parseInt(customAmount);
    }
    return selectedAmount || 0;
  };

  const getReason = () => {
    if (selectedReason === 'Other' && customReason) {
      return customReason;
    }
    return selectedReason || '';
  };

  const canSubmit = () => {
    const amount = getAmount();
    const reason = getReason();
    return amount > 0 && reason.length > 0 && identity;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);
    try {
      const amount = getAmount();
      const reason = getReason();

      const transaction: TransactionInput = {
        amount: mode === 'earn' ? amount : -amount,
        reason,
        category: mode === 'earn' ? 'Reward' : 'Redemption',
        user: identity!,
        childId: activeChildId!,
        timestamp: dateOverride ? new Date(dateOverride) : undefined,
      };

      await addTransaction(transaction);

      // Show success and reset form
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedAmount(null);
        setCustomAmount('');
        setSelectedReason(null);
        setCustomReason('');
        setDateOverride('');
      }, 1500);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Mode Toggle */}
      <div className="card">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('earn')}
            className={`py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'earn'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingUp size={20} />
            Earn
          </button>
          <button
            onClick={() => setMode('spend')}
            className={`py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'spend'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingDown size={20} />
            Spend
          </button>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Select Amount</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`chip ${selectedAmount === amount && !customAmount ? 'chip-selected' : ''}`}
            >
              {amount}m
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="customAmount" className="block text-sm font-medium mb-2">
            Custom Amount (minutes)
          </label>
          <input
            id="customAmount"
            type="number"
            min="1"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            className="input-field"
            placeholder="Enter custom amount"
          />
        </div>
      </div>

      {/* Reason Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Select Reason</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => handleReasonSelect(reason)}
              className={`chip ${selectedReason === reason ? 'chip-selected' : ''}`}
            >
              {reason}
            </button>
          ))}
          <button
            onClick={() => handleReasonSelect('Other')}
            className={`chip ${selectedReason === 'Other' ? 'chip-selected' : ''}`}
          >
            <Plus size={16} className="inline" /> Other
          </button>
        </div>
        {selectedReason === 'Other' && (
          <div>
            <label htmlFor="customReason" className="block text-sm font-medium mb-2">
              Custom Reason
            </label>
            <input
              id="customReason"
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="input-field"
              placeholder="Enter reason"
            />
          </div>
        )}
      </div>

      {/* Date Override */}
      <div className="card">
        <label htmlFor="dateOverride" className="flex items-center gap-2 text-sm font-medium mb-2">
          <Calendar size={16} />
          Date Override (Optional)
        </label>
        <input
          id="dateOverride"
          type="datetime-local"
          value={dateOverride}
          onChange={(e) => setDateOverride(e.target.value)}
          className="input-field"
        />
        {dateOverride && (
          <button
            onClick={() => setDateOverride('')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
          >
            Clear date override
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit() || submitting || success}
        className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          success
            ? 'bg-green-500 text-white'
            : mode === 'earn'
            ? 'btn-primary'
            : 'btn-danger'
        }`}
      >
        {success ? (
          <>
            <Check size={20} />
            Success!
          </>
        ) : submitting ? (
          'Submitting...'
        ) : (
          `${mode === 'earn' ? 'Add' : 'Subtract'} ${getAmount() || 0} minutes`
        )}
      </button>
    </div>
  );
};
