import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFamily } from '../hooks/useFamily';
import { useChild } from '../contexts/ChildContext';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import type { FamilyMember } from '../types';
import { useToast } from '../components/Toast';

interface MemberMatchPageProps {
  onMatchHandled: () => void;
}

export const MemberMatchPage: React.FC<MemberMatchPageProps> = ({ onMatchHandled }) => {
  const { user } = useAuth();
  const { family, findMatchingMember, linkAuthToMember, createMemberInCurrentFamily } = useFamily();
  const { setActiveChildId } = useChild();
  const { toast } = useToast();
  const [matchedMember, setMatchedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [shouldCallHandled, setShouldCallHandled] = useState(false);
  const [noMatchFound, setNoMatchFound] = useState(false);

  useEffect(() => {
    if (!user || !family) {
      setLoading(false);
      return;
    }

    // Check if user already has a member record (not pre-added)
    const existingMember = Object.values(family.members).find(
      m => m.authUserId === user.uid && !m.isPreAdded
    );

    if (existingMember) {
      // User is already linked, schedule callback for after render
      setShouldCallHandled(true);
      setLoading(false);
      return;
    }

    // Look for a matching pre-added member
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    const match = findMatchingMember(userName, user.email || null);

    if (!match) {
      // No match found, schedule callback for after render
      setNoMatchFound(true);
    }

    setMatchedMember(match);
    setLoading(false);
  }, [user, family, findMatchingMember]);

  // Handle callbacks after render (avoiding setState during render)
  useEffect(() => {
    if (shouldCallHandled || noMatchFound) {
      onMatchHandled();
    }
  }, [shouldCallHandled, noMatchFound, onMatchHandled]);

  const handleConfirmMatch = async () => {
    if (!user || !matchedMember) return;

    setLinking(true);
    try {
      const userName = user.displayName || user.email?.split('@')[0] || 'User';
      const childId = await linkAuthToMember(matchedMember.id, userName, user.email || null);
      localStorage.removeItem('selectedRole'); // Clean up

      // Auto-set the activeChildId if the linked member has one
      if (childId) {
        setActiveChildId(childId);
      }

      onMatchHandled();
    } catch (error) {
      console.error('Error linking to member:', error);
      toast(error instanceof Error ? error.message : 'Failed to link to member', 'error');
      setLinking(false);
    }
  };

  const handleDenyMatch = async () => {
    if (!matchedMember) return;

    setLinking(true);
    try {
      // Use the role the user selected, or fall back to the matched member's role
      const selectedRole = (localStorage.getItem('selectedRole') as 'parent' | 'kid') || matchedMember.role;
      localStorage.removeItem('selectedRole'); // Clean up

      // Create a new member with the selected role
      await createMemberInCurrentFamily(selectedRole);
      onMatchHandled();
    } catch (error) {
      console.error('Error creating new member:', error);
      toast(error instanceof Error ? error.message : 'Failed to create new member', 'error');
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600 dark:text-gray-400">Checking for existing family members...</p>
        </div>
      </div>
    );
  }

  // If no match found or already handled, show loading while useEffect triggers callback
  if (!matchedMember || noMatchFound || shouldCallHandled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600 dark:text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Found a Match!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              There is someone already listed with your name or email.
            </p>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Existing Member</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {matchedMember.displayName}
            </div>
            {matchedMember.emails.length > 0 && (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {matchedMember.emails.join(', ')}
              </div>
            )}
            <div className="mt-3">
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  matchedMember.role === 'parent'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}
              >
                {matchedMember.role === 'parent' ? 'Parent' : 'Kid'}
              </span>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Is this you?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If this is you, we'll link your account to this profile.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirmMatch}
              disabled={linking}
              className="w-full p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
            >
              {linking ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Linking...
                </>
              ) : (
                <>
                  <UserCheck size={20} />
                  Yes, this is me
                </>
              )}
            </button>

            <button
              onClick={handleDenyMatch}
              disabled={linking}
              className="w-full p-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserX size={20} />
              No, create a new profile
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            If you select "Yes", your account will be linked to the existing profile.
            Any additional names or emails will be added to your profile.
          </p>
        </div>
      </div>
    </div>
  );
};
