import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useChild } from '../contexts/ChildContext';
import { Baby, Plus, Trash2 } from 'lucide-react';

export const ChildSelectPage: React.FC = () => {
  const { settings, addChild, removeChild } = useSettings();
  const { setActiveChildId } = useChild();
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSelectChild = (childId: string) => {
    setActiveChildId(childId);
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    setAdding(true);
    try {
      await addChild(newChildName.trim());
      setNewChildName('');
      setShowAddChild(false);
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveChild = async (childId: string, childName: string) => {
    if (confirm(`Remove ${childName} from the tracker? This will not delete their history.`)) {
      try {
        await removeChild(childId);
      } catch (error) {
        console.error('Error removing child:', error);
        alert('Failed to remove child');
      }
    }
  };

  if (showAddChild) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Baby size={32} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Add Child</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your child's name
              </p>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="input-field text-center text-xl"
                placeholder="Child's name (e.g., Danny)"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={!newChildName.trim() || adding}
                className="btn-primary w-full text-xl py-4"
              >
                {adding ? 'Adding...' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
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

  const children = settings?.children || [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <Baby size={32} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {children.length === 0 ? 'Add Your First Child' : 'Select Child'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {children.length === 0
                ? 'Add a child to start tracking their time'
                : 'Choose which child to track time for'}
            </p>
          </div>

          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => handleSelectChild(child.id)}
                  className="flex-1 btn-primary text-xl py-6"
                >
                  {child.name}
                </button>
                <button
                  onClick={() => handleRemoveChild(child.id, child.name)}
                  className="p-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400"
                  aria-label={`Remove ${child.name}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddChild(true)}
              className="w-full btn-secondary text-lg py-5 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add {children.length > 0 ? 'Another' : ''} Child
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-6">
            You can manage children later in Settings
          </p>
        </div>
      </div>
    </div>
  );
};
