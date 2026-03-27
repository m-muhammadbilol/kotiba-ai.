import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, CheckSquare, Bell, Wallet, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Suhbat', Icon: MessageCircle },
  { path: '/tasks', label: 'Vazifalar', Icon: CheckSquare },
  { path: '/reminders', label: 'Eslatmalar', Icon: Bell },
  { path: '/money', label: 'Xarajatlar', Icon: Wallet },
  { path: '/settings', label: 'Sozlamalar', Icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-shell bg-[var(--bg)] text-[var(--text)] flex flex-col max-w-lg mx-auto relative">
      {/* Main content */}
      <main className="app-main flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[var(--surface)] border-t border-[var(--border)] z-50">
        <div className="flex items-center justify-around px-2 pt-2">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-semibold tracking-tight ${
                  isActive ? 'text-primary-500 dark:text-primary-400' : ''
                }`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
