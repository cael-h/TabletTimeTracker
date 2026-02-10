import { useState, type FC } from 'react';
import { AlertCircle, UserCheck } from 'lucide-react';
import type { FamilyMember } from '../../types';

interface ParentApprovalSectionProps {
  member: FamilyMember;
  onRequestPermission: () => Promise<void>;
}

export const ParentApprovalSection: FC<ParentApprovalSectionProps> = ({
  member, onRequestPermission,
}) => {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await onRequestPermission();
      setRequested(true);
      alert('Permission request sent! An existing parent will be notified to approve your account.');
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert(error instanceof Error ? error.message : 'Failed to request permission');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
        <h2 className="text-lg font-semibold">Parent Approval Needed</h2>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your account is pending approval from an existing parent. Request permission to gain full access to family settings.
        </p>
        {(requested || member.requestedAt) ? (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={18} className="text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-900 dark:text-green-200">Permission Requested</span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-300">
              An existing parent has been notified. You'll gain access once approved.
            </p>
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <UserCheck size={18} />
            {requesting ? 'Sending Request...' : 'Request Permission to Join as Parent'}
          </button>
        )}
        {member.requestedAt && !requested && (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="btn-secondary w-full text-sm"
          >
            {requesting ? 'Sending...' : 'Send Reminder'}
          </button>
        )}
      </div>
    </div>
  );
};
