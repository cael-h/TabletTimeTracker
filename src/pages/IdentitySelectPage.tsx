import React from 'react';
import { useIdentity } from '../contexts/IdentityContext';
import type { UserIdentity } from '../types';
import { Users } from 'lucide-react';

export const IdentitySelectPage: React.FC = () => {
  const { setIdentity } = useIdentity();

  const handleSelectIdentity = (identity: UserIdentity) => {
    setIdentity(identity);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <Users size={32} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Who are you?</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select your identity to continue
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleSelectIdentity('Mom')}
              className="w-full btn-primary text-xl py-6"
            >
              👩 Mom
            </button>
            <button
              onClick={() => handleSelectIdentity('Dad')}
              className="w-full btn-primary text-xl py-6"
            >
              👨 Dad
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-6">
            You can change this later in Settings
          </p>
        </div>
      </div>
    </div>
  );
};
