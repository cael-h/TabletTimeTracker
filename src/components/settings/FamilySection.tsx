import { useState, type FC } from 'react';
import { Users, Share2, Copy, CheckCircle, Plus, X } from 'lucide-react';
import type { FamilyGroup, MemberRole } from '../../types';

interface FamilySectionProps {
  family: FamilyGroup;
  currentUserId: string;
  isParent: boolean;
  onShareInvite: () => Promise<void>;
  onAddMember: (name: string, email: string | undefined, role: MemberRole) => Promise<void>;
}

export const FamilySection: FC<FamilySectionProps> = ({
  family, currentUserId, isParent, onShareInvite, onAddMember,
}) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'kid'>('kid');
  const [addingMember, setAddingMember] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(family.id);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy family code');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      alert('Please enter a name');
      return;
    }
    setAddingMember(true);
    try {
      await onAddMember(newMemberName.trim(), newMemberEmail.trim() || undefined, newMemberRole);
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

  return (
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

      {/* Share Invite */}
      <button
        onClick={onShareInvite}
        className="w-full mb-4 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Share2 size={20} />
        Invite Family Member
      </button>

      {/* Add Member (parents only) */}
      {isParent && (
        <div className="mb-4">
          {showAddMember ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Add Family Member</h3>
                <button
                  onClick={() => { setShowAddMember(false); setNewMemberName(''); setNewMemberEmail(''); setNewMemberRole('kid'); }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Enter name" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (optional)</label>
                <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="Enter email" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['kid', 'parent'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewMemberRole(role)}
                      className={`py-2 px-4 rounded-lg font-medium ${
                        newMemberRole === role
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {role === 'kid' ? 'Kid' : 'Parent'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddMember}
                disabled={addingMember || !newMemberName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {addingMember ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</>
                ) : (
                  <><Plus size={20} />Add Member</>
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

      {/* Members List */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Family Members ({Object.keys(family.members).length})
        </div>
        <div className="space-y-2">
          {Object.values(family.members).map((member) => (
            <div
              key={member.id}
              className={`p-3 rounded-lg border ${
                member.authUserId === currentUserId
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {member.displayName}
                    {member.authUserId === currentUserId && (
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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.role === 'parent'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
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
  );
};
