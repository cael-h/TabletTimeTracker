import { useState, type FC } from 'react';
import { User } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { useToast } from '../Toast';

interface ProfileSectionProps {
  member: FamilyMember;
  onUpdateDisplayName: (displayName: string) => Promise<void>;
}

export const ProfileSection: FC<ProfileSectionProps> = ({ member, onUpdateDisplayName }) => {
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      await onUpdateDisplayName(editName.trim());
      setShowEdit(false);
      setEditName('');
      toast('Display name updated!');
    } catch (error) {
      console.error('Error updating display name:', error);
      toast(error instanceof Error ? error.message : 'Failed to update display name', 'error');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User size={20} />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</div>
        {showEdit ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-field w-full"
              placeholder="Enter display name"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              <button onClick={() => { setShowEdit(false); setEditName(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-white">{member.displayName}</span>
            <button
              onClick={() => { setEditName(member.displayName); setShowEdit(true); }}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {member.emails.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Affiliated Emails</div>
          <div className="space-y-2">
            {member.emails.map((email, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {email}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
