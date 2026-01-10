import React, { useState } from 'react';
import { useIdentity } from '../contexts/IdentityContext';
import { Users, Edit } from 'lucide-react';

export const IdentitySelectPage: React.FC = () => {
  const { setIdentity } = useIdentity();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSelectIdentity = (identity: string) => {
    setIdentity(identity);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      handleSelectIdentity(customName.trim());
    }
  };

  if (showCustomInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Edit size={32} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">What's your name?</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your name (e.g., Sarah, Grandma, Babysitter)
              </p>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="input-field text-center text-xl"
                placeholder="Your name"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="btn-primary w-full text-xl py-4"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="btn-secondary w-full"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="space-y-3">
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
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full btn-secondary text-lg py-5 flex items-center justify-center gap-2"
            >
              <Edit size={20} />
              Type Name
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
