import { useState, useEffect } from 'react';
import { Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { useFamily } from '../hooks/useFamily';
import type { MemberRole } from '../types';

export const FamilySetupPage = () => {
  const [mode, setMode] = useState<'select' | 'join' | 'create'>('select');
  const [role, setRole] = useState<MemberRole | null>(null);
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createFamily, joinFamily } = useFamily();

  // Check for family code in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('familyCode');
    if (codeFromUrl) {
      setFamilyCode(codeFromUrl.toUpperCase());
      setMode('join');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }
    if (!role) {
      setError('Please select your role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = await createFamily(familyName, role);
      console.log('Family created with code:', code);
      // The useFamily hook will automatically update and the app will navigate forward
    } catch (err) {
      console.error('Error creating family:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      setError('Please enter a family code');
      return;
    }
    if (!role) {
      setError('Please select your role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinFamily(familyCode.toUpperCase(), role);
      console.log('Joined family:', familyCode);
      // The useFamily hook will automatically update and the app will navigate forward
    } catch (err) {
      console.error('Error joining family:', err);
      setError(err instanceof Error ? err.message : 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-3 mb-6">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">I am a:</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setRole('parent')}
          className={`p-4 rounded-lg border-2 transition-all ${
            role === 'parent'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
          }`}
        >
          <div className="font-semibold text-gray-900 dark:text-white">Parent</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Earn points & approve time
          </div>
        </button>
        <button
          onClick={() => setRole('kid')}
          className={`p-4 rounded-lg border-2 transition-all ${
            role === 'kid'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
          }`}
        >
          <div className="font-semibold text-gray-900 dark:text-white">Kid</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Earn & use tablet time
          </div>
        </button>
      </div>
      {role === 'parent' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          Parent accounts require approval from an existing parent before gaining full access.
        </p>
      )}
    </div>
  );

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Family Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join your family or create a new family group
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
            <button
              onClick={() => setMode('join')}
              className="w-full p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-3 font-semibold shadow-lg shadow-primary-500/30"
            >
              <LogIn size={20} />
              Join Existing Family
            </button>

            <button
              onClick={() => setMode('create')}
              className="w-full p-4 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-3 font-semibold shadow-lg shadow-secondary-500/30"
            >
              <Plus size={20} />
              Create New Family
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join Family
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the family code to join
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            {renderRoleSelection()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Family Code
                </label>
                <input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinFamily}
                disabled={loading || !familyCode || !role}
                className="w-full p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Joining...
                  </>
                ) : (
                  <>Join Family</>
                )}
              </button>

              <button
                onClick={() => {
                  setMode('select');
                  setFamilyCode('');
                  setRole(null);
                  setError('');
                }}
                className="w-full p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Family
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your family group
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            {renderRoleSelection()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateFamily}
                disabled={loading || !familyName || !role}
                className="w-full p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  <>Create Family</>
                )}
              </button>

              <button
                onClick={() => {
                  setMode('select');
                  setFamilyName('');
                  setRole(null);
                  setError('');
                }}
                className="w-full p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
