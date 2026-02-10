import { useState, type FC } from 'react';
import { User, Edit } from 'lucide-react';

interface IdentitySectionProps {
  identity: string;
  onSetIdentity: (name: string) => void;
}

export const IdentitySection: FC<IdentitySectionProps> = ({ identity, onSetIdentity }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      onSetIdentity(customName.trim());
      setCustomName('');
      setShowCustomInput(false);
      setShowSelector(false);
    }
  };

  const getIdentityDisplay = () => {
    if (identity === 'Mom') return '👩 Mom';
    if (identity === 'Dad') return '👨 Dad';
    return `✏️ ${identity}`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User size={20} />
          <h2 className="text-lg font-semibold">Your Identity</h2>
        </div>
      </div>
      {showCustomInput ? (
        <div className="space-y-3">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomNameSubmit()}
            className="input-field"
            placeholder="Enter your name"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleCustomNameSubmit} disabled={!customName.trim()} className="btn-primary flex-1">
              Save
            </button>
            <button onClick={() => { setShowCustomInput(false); setCustomName(''); }} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      ) : showSelector ? (
        <div className="space-y-2">
          {['Mom', 'Dad'].map((name) => (
            <button
              key={name}
              onClick={() => { onSetIdentity(name); setShowSelector(false); }}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                identity === name
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {name === 'Mom' ? '👩 Mom' : '👨 Dad'}
            </button>
          ))}
          <button
            onClick={() => { setShowCustomInput(true); setShowSelector(false); }}
            className="w-full py-3 px-4 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            Type Name
          </button>
          <button onClick={() => setShowSelector(false)} className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-xl font-medium">{getIdentityDisplay()}</span>
          <button onClick={() => setShowSelector(true)} className="btn-secondary">
            Change
          </button>
        </div>
      )}
    </div>
  );
};
