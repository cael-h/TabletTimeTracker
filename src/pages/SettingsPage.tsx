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
  const { settings, addRewardReason, removeRewardReason, addRedemptionReason, removeRedemptionReason, addChoreReason, removeChoreReason } = useSettings();
  const { addTransaction, balance } = useTransactions();
  const { family, shareInvite, addManualMember, isApprovedParent, updateDisplayName, updateMemberColor } = useFamily();
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
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'kid'>('kid');
  const [addingMember, setAddingMember] = useState(false);
  const [showEditDisplayName, setShowEditDisplayName] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');

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

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      alert('Please enter a name');
      return;
    }

    setAddingMember(true);
    try {
      await addManualMember(
        newMemberName.trim(),
        newMemberEmail.trim() || undefined,
        newMemberRole
      );
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberRole('kid');
      setShowAddMember(false);
      alert('Family member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error instanceof Error ? error.message : 'Failed to add family member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!editDisplayName.trim() || !user) return;

    try {
      await updateDisplayName(user.uid, editDisplayName.trim());
      setShowEditDisplayName(false);
      setEditDisplayName('');
      alert('Display name updated successfully!');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert(error instanceof Error ? error.message : 'Failed to update display name');
    }
  };

  const getCurrentMemberInfo = () => {
    if (!user || !family) return null;
    return family.members[user.uid];
  };

  const handleUpdateMemberColor = async (memberId: string, color: string) => {
    try {
      await updateMemberColor(memberId, color);
    } catch (error) {
      console.error('Error updating member color:', error);
      alert(error instanceof Error ? error.message : 'Failed to update color');
    }
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

      {/* Display Name & Emails Section */}
      {family && getCurrentMemberInfo() && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={20} />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</div>
            {showEditDisplayName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter display name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdateDisplayName} className="btn-primary flex-1">
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowEditDisplayName(false);
                      setEditDisplayName('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">
                  {getCurrentMemberInfo()?.displayName}
                </span>
                <button
                  onClick={() => {
                    setEditDisplayName(getCurrentMemberInfo()?.displayName || '');
                    setShowEditDisplayName(true);
                  }}
                  className="btn-secondary text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Affiliated Emails */}
          {getCurrentMemberInfo()?.emails && getCurrentMemberInfo()!.emails.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Affiliated Emails
              </div>
              <div className="space-y-2">
                {getCurrentMemberInfo()!.emails.map((email, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  >
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

          {/* Add Family Member Manually (only for approved parents) */}
          {isApprovedParent() && (
            <div className="mb-4">
              {showAddMember ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Add Family Member</h3>
                    <button
                      onClick={() => {
                        setShowAddMember(false);
                        setNewMemberName('');
                        setNewMemberEmail('');
                        setNewMemberRole('kid');
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Enter name"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter email"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setNewMemberRole('kid')}
                        className={`py-2 px-4 rounded-lg font-medium ${
                          newMemberRole === 'kid'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Kid
                      </button>
                      <button
                        onClick={() => setNewMemberRole('parent')}
                        className={`py-2 px-4 rounded-lg font-medium ${
                          newMemberRole === 'parent'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Parent
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberName.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {addingMember ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Add Member
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="w-full py-3 px-4 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  Add Family Member Manually
                </button>
              )}
            </div>
          )}

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
                    member.authUserId === user?.uid
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.displayName}
                        {member.authUserId === user?.uid && (
                          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">(You)</span>
                        )}
                        {member.isPreAdded && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Not signed in yet)</span>
                        )}
                      </div>
                      {member.emails.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">{member.emails[0]}</div>
                      )}
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

      {/* Family Member Colors */}
      {family && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} />
            <h2 className="text-lg font-semibold">Family Member Colors</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a color for each family member to easily identify them throughout the app
          </p>
          <div className="space-y-3">
            {Object.values(family.members)
              .filter(member => !member.isPreAdded)
              .sort((a, b) => {
                // Sort by role (parents first), then by name
                if (a.role === 'parent' && b.role !== 'parent') return -1;
                if (a.role !== 'parent' && b.role === 'parent') return 1;
                return a.displayName.localeCompare(b.displayName);
              })
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: member.color || '#6b7280' }}
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.displayName}
                      </span>
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                          member.role === 'parent'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {member.role === 'parent' ? 'Parent' : 'Kid'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="color"
                    value={member.color || '#6b7280'}
                    onChange={(e) => handleUpdateMemberColor(member.id, e.target.value)}
                    className="w-12 h-10 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              ))}
            {Object.values(family.members).filter(m => !m.isPreAdded).length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                No family members yet. Add some family members to customize their colors.
              </p>
            )}
          </div>
        </div>
      )}

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
