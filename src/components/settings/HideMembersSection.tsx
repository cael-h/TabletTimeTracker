import type { FC } from 'react';
import { EyeOff } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { useHiddenMembers } from '../../contexts/HiddenMembersContext';

interface HideMembersSectionProps {
  members: FamilyMember[];
}

export const HideMembersSection: FC<HideMembersSectionProps> = ({ members }) => {
  const { isHidden, toggleHiddenMember } = useHiddenMembers();

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'parent' && b.role !== 'parent') return -1;
    if (a.role !== 'parent' && b.role === 'parent') return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <EyeOff size={20} />
        <h2 className="text-lg font-semibold">Hide Family Members</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Hide members from the dashboard, activity log, and history on this device. Their data is kept — they just won't appear here.
      </p>
      <div className="space-y-3">
        {sortedMembers.map((member) => {
          const hidden = isHidden(member.id);
          return (
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{member.displayName}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      member.role === 'parent'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {member.role === 'parent' ? 'Parent' : 'Kid'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleHiddenMember(member.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  hidden
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-primary-500'
                }`}
                role="switch"
                aria-checked={!hidden}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    hidden ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            No family members yet.
          </p>
        )}
      </div>
    </div>
  );
};
