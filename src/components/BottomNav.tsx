import React from 'react';
import { Home, Plus, Clock, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'add', label: 'Add', icon: Plus },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
