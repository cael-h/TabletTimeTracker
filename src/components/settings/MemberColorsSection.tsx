import type { FC } from 'react';
import { EyeOff, Palette } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { useHiddenMembers } from '../../contexts/HiddenMembersContext';
import { useToast } from '../Toast';

interface MemberColorsSectionProps {
  members: FamilyMember[];
  onUpdateColor: (memberId: string, color: string) => Promise<void>;
}

export const MemberColorsSection: FC<MemberColorsSectionProps> = ({ members, onUpdateColor }) => {
  const { toast } = useToast();
  const { isHidden, toggleHiddenMember } = useHiddenMembers();

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'parent' && b.role !== 'parent') return -1;
    if (a.role !== 'parent' && b.role === 'parent') return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const handleColorChange = async (memberId: string, color: string) => {
    try {
      await onUpdateColor(memberId, color);
    } catch (error) {
      console.error('Error updating member color:', error);
      toast(error instanceof Error ? error.message : 'Failed to update color', 'error');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} />
        <h2 className="text-lg font-semibold">Family Members</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Pick each member&apos;s color and hide non-participating members from the Home and Add/Spend selection buttons on this device.
        Names still stay visible here and in history.
      </p>
      <div className="space-y-3">
        {sortedMembers.map((member) => {
          const hidden = isHidden(member.id);
          return (
            <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: member.color || '#6b7280' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{member.displayName}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        member.role === 'parent'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {member.role === 'parent' ? 'Parent' : 'Kid'}
                      </span>
                      {hidden && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                          Hidden from buttons
                        </span>
                      )}
                    </div>
                    {member.isPreAdded && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Not signed in yet</span>
                    )}
                  </div>
                </div>
                <input
                  type="color"
                  value={member.color || '#6b7280'}
                  onChange={(e) => handleColorChange(member.id, e.target.value)}
                  className="w-12 h-10 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0"
                  aria-label={`Choose color for ${member.displayName}`}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <EyeOff size={16} />
                  <span>Hide from Home and Add/Spend buttons</span>
                </div>
                <button
                  onClick={() => toggleHiddenMember(member.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    hidden ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary-500'
                  }`}
                  role="switch"
                  aria-checked={!hidden}
                  aria-label={`${hidden ? 'Show' : 'Hide'} ${member.displayName} in Home and Add/Spend buttons`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      hidden ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            No family members yet. Add some family members to customize their colors.
          </p>
        )}
      </div>
    </div>
  );
};
