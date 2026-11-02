import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, useTheme } from '../components/ThemeToggle';
import { authApi } from '../api/client';

const SAVED_SOURCES = [
  { outlet: 'BBC News', url: 'https://bbc.com' },
  { outlet: 'Reuters', url: 'https://reuters.com' },
  { outlet: 'The Hindu', url: 'https://thehindu.com' },
];

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = React.useState<'EN' | 'HI'>('EN');

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <main aria-label="Profile and settings" className="pb-24">
      <header className="px-4 pt-4 pb-3">
        <h1 className="font-serif text-2xl text-[var(--color-text)]">Profile</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* User info */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                            flex items-center justify-center font-serif text-lg">
              A
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]">Alex Reporter</p>
              <p className="text-sm font-mono text-[var(--color-text-secondary)]">journalist@example.com</p>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Appearance</h2>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>

        {/* Language */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Language</h2>
          <div
            role="radiogroup"
            aria-label="Language preference"
            className="flex rounded-xl bg-[var(--color-surface-alt)] p-1 gap-1"
          >
            {(['EN', 'HI'] as const).map((lang) => (
              <button
                key={lang}
                role="radio"
                aria-checked={language === lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-2 rounded-lg text-sm font-mono transition-all touch-target
                  ${language === lang
                    ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)] font-medium'
                    : 'text-[var(--color-text-secondary)]'
                  }`}
              >
                {lang === 'EN' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
              </button>
            ))}
          </div>
        </div>

        {/* Saved sources */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Saved Sources</h2>
          <ul className="space-y-2">
            {SAVED_SOURCES.map((src) => (
              <li key={src.outlet} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text)]">{src.outlet}</span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text)] touch-target"
                  aria-label={`Visit ${src.outlet}`}
                >
                  Visit ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* App info */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-2">About</h2>
          <p className="text-xs font-mono text-[var(--color-text-secondary)]">
            News Investigation · v1.0.0<br/>
            All AI outputs require verification before publishing.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-2xl border-2 border-red-300 dark:border-red-800
                     text-red-600 dark:text-red-400 font-medium text-sm touch-target
                     hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    </main>
  );
};
