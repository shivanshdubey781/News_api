import React, { useEffect } from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onChange }) => {
  const options = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '⚙️' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className="flex rounded-xl bg-[var(--color-surface-alt)] p-1 gap-1"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={theme === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm
                      transition-all touch-target
                      ${theme === opt.value
                        ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)] font-medium'
                        : 'text-[var(--color-text-secondary)]'
                      }`}
        >
          <span aria-hidden="true">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

// Hook to apply theme class to root
export function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('dark', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
