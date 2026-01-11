import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { useFamily } from '../hooks/useFamily';
import { useIdentity } from '../contexts/IdentityContext';
import { TrendingUp, TrendingDown, Calendar, Plus, Check, Award, Briefcase, User } from 'lucide-react';
import type { TransactionInput, TransactionCategory, TransactionUnit } from '../types';

const QUICK_AMOUNTS = [3, 5, 10, 15, 30, 60];

export const AddTransactionPage: React.FC = () => {
  const [category, setCategory] = useState<TransactionCategory>('Reward');
  const [unit, setUnit] = useState<TransactionUnit>('minutes');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [dateOverride, setDateOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Success!');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { user } = useAuth();
  const { addTransaction } = useTransactions();
  const { settings } = useSettings();
  const { family, isApprovedParent } = useFamily();
  const { identity } = useIdentity();

  const isParent = isApprovedParent();

  // Get available family members
  const availableMembers = family
    ? Object.values(family.members).filter(m => !m.isPreAdded && m.childId)
    : [];

  // Set default selected member to current user or first available
  useEffect(() => {
    if (!selectedMemberId && availableMembers.length > 0) {
      // Try to find current user's member record
      const currentUserMember = availableMembers.find(m => m.authUserId === user?.uid);
      if (currentUserMember) {
        setSelectedMemberId(currentUserMember.id);
      } else {
        setSelectedMemberId(availableMembers[0].id);
      }
    }
  }, [availableMembers, selectedMemberId, user]);

  const selectedMember = availableMembers.find(m => m.id === selectedMemberId);

  // Update unit based on selected member's role
  useEffect(() => {
    if (selectedMember) {
      setUnit(selectedMember.role === 'kid' ? 'minutes' : 'points');
    }
  }, [selectedMember]);

  const reasons =
    category === 'Reward'
      ? settings?.rewardReasons || []
      : category === 'Redemption'
      ? settings?.redemptionReasons || []
      : category === 'Chore'
      ? settings?.choreReasons || []
      : [];

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
    return amount > 0 && reason.length > 0 && identity && selectedMember;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !user || !selectedMember) return;

    setSubmitting(true);
    try {
      const amount = getAmount();
      const reason = getReason();
      const finalAmount = category === 'Redemption' ? -amount : amount;

      // Determine if this transaction needs approval
      // Kids adding time (positive amount) need approval
      // Kids removing time (negative amount/redemption) don't need approval
      // Parents always auto-approved
      let status: 'approved' | 'pending' = 'approved';
      if (!isParent && finalAmount > 0) {
        status = 'pending';
      }

      const transaction: TransactionInput = {
        amount: finalAmount,
        reason,
        category,
        user: identity!,
        userId: user.uid,
        childId: selectedMember.childId!,
        unit,
        timestamp: dateOverride ? new Date(dateOverride) : undefined,
        status,
      };

      await addTransaction(transaction);

      // Show success and reset form
      setSuccess(true);
      if (status === 'pending') {
        setSuccessMessage('Sent for approval!');
      } else {
        setSuccessMessage('Success!');
      }
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('Success!');
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
      {/* Family Member Selection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <User size={20} />
          <h2 className="text-lg font-semibold">For</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {availableMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`py-3 px-4 rounded-lg font-medium flex items-center gap-2 transition-all ${
                selectedMemberId === member.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {member.color && (
                <div
                  className="w-4 h-4 rounded-full border-2 border-current"
                  style={{ backgroundColor: member.color }}
                />
              )}
              <span className="truncate">{member.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Category</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCategory('Reward')}
            className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              category === 'Reward'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingUp size={18} />
            Reward
          </button>
          <button
            onClick={() => setCategory('Redemption')}
            className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              category === 'Redemption'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingDown size={18} />
            Redemption
          </button>
          <button
            onClick={() => setCategory('Chore')}
            className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              category === 'Chore'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Briefcase size={18} />
            Chore
          </button>
          <button
            onClick={() => setCategory('Adjustment')}
            className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              category === 'Adjustment'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Award size={18} />
            Adjustment
          </button>
        </div>
      </div>

      {/* Unit Toggle */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Unit Type</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setUnit('minutes')}
            className={`py-3 rounded-lg font-semibold transition-all ${
              unit === 'minutes'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Minutes
          </button>
          <button
            onClick={() => setUnit('points')}
            className={`py-3 rounded-lg font-semibold transition-all ${
              unit === 'points'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Points
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
              {amount}{unit === 'minutes' ? 'm' : ' pts'}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="customAmount" className="block text-sm font-medium mb-2">
            Custom Amount ({unit})
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
            : category === 'Redemption'
            ? 'btn-danger'
            : category === 'Chore'
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'btn-primary'
        }`}
      >
        {success ? (
          <>
            <Check size={20} />
            {successMessage}
          </>
        ) : submitting ? (
          'Submitting...'
        ) : (
          `${category === 'Redemption' ? 'Subtract' : 'Add'} ${getAmount() || 0} ${unit === 'minutes' ? 'minutes' : 'points'}`
        )}
      </button>
    </div>
  );
};
