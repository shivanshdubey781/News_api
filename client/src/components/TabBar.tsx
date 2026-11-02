import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <nav
      aria-label="News categories"
      className="tabs-scroll flex px-4 py-2 gap-2 bg-[var(--color-bg)] sticky top-0 z-20 border-b border-[var(--color-border)]"
      ref={scrollRef}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`relative flex-shrink-0 px-3 py-2 text-sm transition-colors touch-target
              ${isActive
                ? 'text-[var(--color-text)] font-semibold'
                : 'text-[var(--color-text-secondary)] font-normal hover:text-[var(--color-text)]'
              }`}
          >
            {tab}
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--color-text)]"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
