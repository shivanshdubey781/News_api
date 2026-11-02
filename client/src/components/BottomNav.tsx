import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const NewsIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} aria-hidden="true">
    <path d="M4 6h16M4 10h16M4 14h8M4 18h8" strokeLinecap="round"/>
    {filled && <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.2"/>}
  </svg>
);

const DiscoverIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} aria-hidden="true">
    <circle cx="11" cy="11" r="7" strokeWidth={filled ? 0 : 1.8} fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1}/>
    {filled ? (
      <>
        <circle cx="11" cy="11" r="7" fill="currentColor" opacity="0.2"/>
        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </>
    ) : (
      <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeWidth="1.8"/>
    )}
  </svg>
);

const CasesIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} aria-hidden="true">
    <path d={filled
      ? "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
      : "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"}
      fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1}
    />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth={filled ? 2 : 1.8} fill="none" strokeLinecap="round"/>
    {filled && <rect x="2" y="7" width="20" height="14" rx="2" fill="currentColor" opacity="0.2"/>}
  </svg>
);

const ProfileIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.3 : 1} strokeWidth={filled ? 0 : 1.8}/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1} strokeWidth={filled ? 0 : 1.8} strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'News',
    icon: <NewsIcon />,
    activeIcon: <NewsIcon filled />,
  },
  {
    path: '/discover',
    label: 'Discover',
    icon: <DiscoverIcon />,
    activeIcon: <DiscoverIcon filled />,
  },
  {
    path: '/cases',
    label: 'Cases',
    icon: <CasesIcon />,
    activeIcon: <CasesIcon filled />,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: <ProfileIcon />,
    activeIcon: <ProfileIcon filled />,
  },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Main navigation"
      className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                 flex items-center bg-[var(--color-surface)]/95 backdrop-blur-md
                 border-t border-[var(--color-border)] z-30"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 touch-target
              transition-colors min-h-[56px]
              ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            <span className="relative">
              {isActive ? item.activeIcon : item.icon}
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-text)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </span>
            <span className={`text-xs ${isActive ? 'font-medium' : 'font-light'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
