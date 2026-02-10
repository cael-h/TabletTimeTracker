import type { FC } from 'react';
import { Palette } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { useToast } from '../Toast';

interface MemberColorsSectionProps {
  members: FamilyMember[];
  onUpdateColor: (memberId: string, color: string) => Promise<void>;
}

export const MemberColorsSection: FC<MemberColorsSectionProps> = ({ members, onUpdateColor }) => {
  const { toast } = useToast();
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
        <h2 className="text-lg font-semibold">Family Member Colors</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Choose a color for each family member to easily identify them throughout the app
      </p>
      <div className="space-y-3">
        {sortedMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
                {member.isPreAdded && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Not signed in yet</span>
                )}
              </div>
            </div>
            <input
              type="color"
              value={member.color || '#6b7280'}
              onChange={(e) => handleColorChange(member.id, e.target.value)}
              className="w-12 h-10 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            No family members yet. Add some family members to customize their colors.
          </p>
        )}
      </div>
    </div>
  );
};
