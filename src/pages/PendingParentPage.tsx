import React, { useState } from 'react';
import { useFamily } from '../hooks/useFamily';
import { UserCheck, Clock } from 'lucide-react';

export const PendingParentPage: React.FC = () => {
  const { getCurrentMember, requestPermission } = useFamily();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const currentMember = getCurrentMember();
  const hasRequested = currentMember?.requestedAt !== undefined;

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      await requestPermission();
      setRequested(true);
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert(error instanceof Error ? error.message : 'Failed to request permission');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
              <Clock size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Parent Approval Needed</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is pending approval from an existing parent
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Missing or Insufficient Permissions
              </h2>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Parent accounts require approval from an existing approved parent before gaining full access.
                This helps keep your family's data secure.
              </p>
            </div>

            {requested || hasRequested ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={20} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-900 dark:text-green-200">
                    Permission Request Sent
                  </h3>
                </div>
                <p className="text-sm text-green-800 dark:text-green-300">
                  An existing parent has been notified of your request. You'll be able to access the app once they approve your account.
                </p>
              </div>
            ) : (
              <button
                onClick={handleRequestPermission}
                disabled={requesting}
                className="btn-primary w-full text-lg py-4"
              >
                {requesting ? 'Sending Request...' : 'Request Permission to Join as Parent'}
              </button>
            )}

            {hasRequested && !requested && (
              <button
                onClick={handleRequestPermission}
                disabled={requesting}
                className="btn-secondary w-full"
              >
                {requesting ? 'Sending Request...' : 'Send Reminder'}
              </button>
            )}

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Please wait for an existing parent to approve your request.</p>
              <p className="mt-2">You can close this page and check back later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
