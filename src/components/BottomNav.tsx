import React from 'react';
import { Home, Plus, Clock, Settings, CheckSquare, Tablet } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate, pendingCount = 0 }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'usage', label: 'Timer', icon: Tablet },
    { id: 'add', label: 'Add', icon: Plus },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingCount },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="grid grid-cols-6 h-16">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon size={24} />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
