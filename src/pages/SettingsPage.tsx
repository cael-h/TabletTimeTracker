import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTransactions } from '../hooks/useTransactions';
import { useFamily } from '../hooks/useFamily';
import { useIdentity } from '../contexts/IdentityContext';
import { useChild } from '../contexts/ChildContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  User,
  LogOut,
  Plus,
  X,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Edit,
  Briefcase,
  Palette,
  Users,
  Share2,
  Copy,
  CheckCircle,
} from 'lucide-react';
import type { ThemeMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { signOut, user } = useAuth();
  const { settings, addRewardReason, removeRewardReason, addRedemptionReason, removeRedemptionReason, addChoreReason, removeChoreReason, updateChildColor } = useSettings();
  const { addTransaction, balance } = useTransactions();
  const { family, shareInvite } = useFamily();
  const { identity, setIdentity } = useIdentity();
  const { activeChildId } = useChild();
  const { theme, setTheme } = useTheme();

  const [newRewardReason, setNewRewardReason] = useState('');
  const [newRedemptionReason, setNewRedemptionReason] = useState('');
  const [newChoreReason, setNewChoreReason] = useState('');
  const [showIdentitySelector, setShowIdentitySelector] = useState(false);
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [resetting, setResetting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleAddRewardReason = async () => {
    if (!newRewardReason.trim()) return;
    await addRewardReason(newRewardReason.trim());
    setNewRewardReason('');
  };

  const handleAddRedemptionReason = async () => {
    if (!newRedemptionReason.trim()) return;
    await addRedemptionReason(newRedemptionReason.trim());
    setNewRedemptionReason('');
  };

  const handleAddChoreReason = async () => {
    if (!newChoreReason.trim()) return;
    await addChoreReason(newChoreReason.trim());
    setNewChoreReason('');
  };

  const handleResetBalance = async () => {
    if (!identity || !user) return;

    const confirmed = confirm(
      `Are you sure you want to reset the balance to 0? Current balance: ${balance}. This will create an adjustment transaction.`
    );

    if (!confirmed) return;

    setResetting(true);
    try {
      await addTransaction({
        amount: -balance,
        reason: 'Balance Reset',
        category: 'Adjustment',
        user: identity,
        userId: user.uid,
        childId: activeChildId!,
        unit: 'minutes', // Default to minutes for reset
      });
      alert('Balance reset successfully!');
    } catch (error) {
      console.error('Error resetting balance:', error);
      alert('Failed to reset balance');
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const handleCopyCode = async () => {
    if (!family) return;
    try {
      await navigator.clipboard.writeText(family.id);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy family code');
    }
  };

  const handleShareInvite = async () => {
    try {
      await shareInvite();
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const themeOptions: { value: ThemeMode; icon: any; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      setIdentity(customName.trim());
      setCustomName('');
      setShowCustomNameInput(false);
      setShowIdentitySelector(false);
    }
  };

  const getIdentityDisplay = () => {
    if (identity === 'Mom') return '👩 Mom';
    if (identity === 'Dad') return '👨 Dad';
    return `✏️ ${identity}`;
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Identity Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={20} />
            <h2 className="text-lg font-semibold">Your Identity</h2>
          </div>
        </div>
        {showCustomNameInput ? (
          <div className="space-y-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomNameSubmit()}
              className="input-field"
              placeholder="Enter your name"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCustomNameSubmit}
                disabled={!customName.trim()}
                className="btn-primary flex-1"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowCustomNameInput(false);
                  setCustomName('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : showIdentitySelector ? (
          <div className="space-y-2">
            <button
              onClick={() => {
                setIdentity('Mom');
                setShowIdentitySelector(false);
              }}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                identity === 'Mom'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              👩 Mom
            </button>
            <button
              onClick={() => {
                setIdentity('Dad');
                setShowIdentitySelector(false);
              }}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                identity === 'Dad'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              👨 Dad
            </button>
            <button
              onClick={() => {
                setShowCustomNameInput(true);
                setShowIdentitySelector(false);
              }}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <Edit size={18} />
              Type Name
            </button>
            <button
              onClick={() => setShowIdentitySelector(false)}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xl font-medium">{getIdentityDisplay()}</span>
            <button
              onClick={() => setShowIdentitySelector(true)}
              className="btn-secondary"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Family Section */}
      {family && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <h2 className="text-lg font-semibold">Family</h2>
            </div>
          </div>

          {/* Family Name and Code */}
          <div className="mb-4 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Family Name</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-3">{family.name}</div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Family Code</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-widest">
                {family.id}
              </div>
              <button
                onClick={handleCopyCode}
                className={`p-2 rounded-lg transition-all ${
                  codeCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {codeCopied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Share Invite Button */}
          <button
            onClick={handleShareInvite}
            className="w-full mb-4 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 size={20} />
            Invite Family Member
          </button>

          {/* Family Members List */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Family Members ({Object.keys(family.members).length})
            </div>
            <div className="space-y-2">
              {Object.values(family.members).map((member) => (
                <div
                  key={member.id}
                  className={`p-3 rounded-lg border ${
                    member.id === user?.uid
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                        {member.id === user?.uid && (
                          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{member.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'parent'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {member.role === 'parent' ? 'Parent' : 'Kid'}
                      </span>
                      {member.status === 'pending' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`py-3 px-4 rounded-lg font-medium flex flex-col items-center gap-2 ${
                theme === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon size={24} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reward Reasons */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-green-600" />
          <h2 className="text-lg font-semibold">Reward Reasons</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings?.rewardReasons.map((reason) => (
            <div
              key={reason}
              className="chip flex items-center gap-2 chip-selected"
            >
              {reason}
              <button
                onClick={() => removeRewardReason(reason)}
                className="hover:bg-white/20 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRewardReason}
            onChange={(e) => setNewRewardReason(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddRewardReason()}
            placeholder="Add new reason"
            className="input-field flex-1"
          />
          <button
            onClick={handleAddRewardReason}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Redemption Reasons */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={20} className="text-red-600" />
          <h2 className="text-lg font-semibold">Redemption Reasons</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings?.redemptionReasons.map((reason) => (
            <div
              key={reason}
              className="chip flex items-center gap-2 chip-selected"
            >
              {reason}
              <button
                onClick={() => removeRedemptionReason(reason)}
                className="hover:bg-white/20 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRedemptionReason}
            onChange={(e) => setNewRedemptionReason(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddRedemptionReason()}
            placeholder="Add new reason"
            className="input-field flex-1"
          />
          <button
            onClick={handleAddRedemptionReason}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Chore Reasons */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Chore Reasons</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings?.choreReasons.map((reason) => (
            <div
              key={reason}
              className="chip flex items-center gap-2 chip-selected"
            >
              {reason}
              <button
                onClick={() => removeChoreReason(reason)}
                className="hover:bg-white/20 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newChoreReason}
            onChange={(e) => setNewChoreReason(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddChoreReason()}
            placeholder="Add new reason"
            className="input-field flex-1"
          />
          <button
            onClick={handleAddChoreReason}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* People Colors */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} />
          <h2 className="text-lg font-semibold">Person Colors</h2>
        </div>
        <div className="space-y-3">
          {settings?.children.map((person) => (
            <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="font-medium" style={{ color: person.color || '#6b7280' }}>
                {person.name}
              </span>
              <input
                type="color"
                value={person.color || '#6b7280'}
                onChange={(e) => updateChildColor(person.id, e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          ))}
          {(!settings?.children || settings.children.length === 0) && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No people added yet. Add people from the Child Select page.
            </p>
          )}
        </div>
      </div>

      {/* Reset Balance */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Reset Balance</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will create an adjustment transaction to set the balance to 0.
        </p>
        <button
          onClick={handleResetBalance}
          disabled={resetting || balance === 0}
          className="btn-danger w-full flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          {resetting ? 'Resetting...' : 'Reset Balance to 0'}
        </button>
      </div>

      {/* Sign Out */}
      <div className="card">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Tablet Time Tracker v1.0</p>
        <p className="mt-1">Made with ❤️ for families</p>
      </div>
    </div>
  );
};
