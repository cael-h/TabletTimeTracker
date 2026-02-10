import type { FC, ComponentType } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface ThemeSectionProps {
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

const themeOptions: { value: ThemeMode; icon: ComponentType<{ size?: number }>; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export const ThemeSection: FC<ThemeSectionProps> = ({ theme, onSetTheme }) => (
  <div className="card">
    <h2 className="text-lg font-semibold mb-4">Theme</h2>
    <div className="grid grid-cols-3 gap-2">
      {themeOptions.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onSetTheme(value)}
          className={`py-3 px-4 rounded-lg font-medium flex flex-col items-center gap-2 ${
            theme === value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Icon size={24} />
          <span className="text-sm">{label}</span>
        </button>
      ))}
    </div>
  </div>
);
