import { useState } from 'react';
import { useFamily } from '../hooks/useFamily';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { UserCheck, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const ApprovalsPage = () => {
  const { isApprovedParent, getPendingParentRequests, updateMemberStatus } = useFamily();
  const { pendingTransactions, updateTransactionStatus } = useTransactions();
  const { settings } = useSettings();
  const [loading, setLoading] = useState<string | null>(null);

  const pendingParents = getPendingParentRequests();
  const isParent = isApprovedParent();

  const handleApproveMember = async (memberId: string) => {
    if (!isParent) return;
    setLoading(`member-${memberId}`);
    try {
      await updateMemberStatus(memberId, 'approved');
    } catch (err) {
      console.error('Error approving member:', err);
      alert('Failed to approve member');
    } finally {
      setLoading(null);
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!isParent) return;
    setLoading(`member-${memberId}`);
    try {
      await updateMemberStatus(memberId, 'rejected');
    } catch (err) {
      console.error('Error rejecting member:', err);
      alert('Failed to reject member');
    } finally {
      setLoading(null);
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    if (!isParent) return;
    setLoading(`txn-${transactionId}`);
    try {
      await updateTransactionStatus(transactionId, 'approved');
    } catch (err) {
      console.error('Error approving transaction:', err);
      alert('Failed to approve transaction');
    } finally {
      setLoading(null);
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    if (!isParent) return;
    setLoading(`txn-${transactionId}`);
    try {
      await updateTransactionStatus(transactionId, 'rejected');
    } catch (err) {
      console.error('Error rejecting transaction:', err);
      alert('Failed to reject transaction');
    } finally {
      setLoading(null);
    }
  };

  const getChildName = (childId: string) => {
    const child = settings?.children.find((c) => c.id === childId);
    return child?.name || 'Unknown';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Approval Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isParent ? 'Review and approve pending requests' : 'View pending requests'}
          </p>
        </div>

        {/* Pending Parent Requests */}
        {pendingParents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UserCheck size={20} />
              Parent Requests ({pendingParents.length})
            </h2>
            <div className="space-y-3">
              {pendingParents.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {member.displayName}
                      </h3>
                      {member.emails && member.emails.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.emails[0]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Requested {formatTime(member.joinedAt)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                      Parent
                    </span>
                  </div>

                  {isParent && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveMember(member.id)}
                        disabled={loading === `member-${member.id}`}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                      >
                        {loading === `member-${member.id}` ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectMember(member.id)}
                        disabled={loading === `member-${member.id}`}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                      >
                        {loading === `member-${member.id}` ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={20} />
              Time Requests ({pendingTransactions.length})
            </h2>
            <div className="space-y-3">
              {pendingTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getChildName(txn.childId)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested by {txn.user}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          txn.amount > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {txn.amount > 0 ? '+' : ''}
                        {txn.amount} {txn.unit}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {txn.reason}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTime(txn.timestamp)}
                    </p>
                  </div>

                  {isParent && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveTransaction(txn.id)}
                        disabled={loading === `txn-${txn.id}`}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                      >
                        {loading === `txn-${txn.id}` ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectTransaction(txn.id)}
                        disabled={loading === `txn-${txn.id}`}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                      >
                        {loading === `txn-${txn.id}` ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingParents.length === 0 && pendingTransactions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-gray-400 dark:text-gray-500" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no pending requests to review
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
