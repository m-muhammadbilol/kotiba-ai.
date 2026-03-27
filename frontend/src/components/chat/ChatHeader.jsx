import React, { useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import HeaderMenu from './HeaderMenu.jsx';
import { getCurrentTimeLabel } from '../../utils/time.js';

export default function ChatHeader({
  aiName,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onClearRequest,
}) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeLabel());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(getCurrentTimeLabel());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[color:rgba(255,255,255,0.82)] px-4 pb-4 pt-14 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:bg-[color:rgba(15,23,42,0.72)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#5b5ff6,#2f6df6)] shadow-[0_16px_34px_-18px_rgba(47,109,246,0.6)]">
            <span className="text-sm font-black text-white">K</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold leading-tight text-[var(--text)]">
              {aiName || 'Kotiba'}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Faol</span>
              <span>•</span>
              <span>Toshkent {currentTime}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Chat menyusi"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={onMenuToggle}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[var(--text-muted)] shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)] transition-colors hover:text-[var(--text)] dark:bg-surface-800/90"
          >
            <MoreVertical size={18} />
          </button>

          <HeaderMenu
            isOpen={isMenuOpen}
            onClose={onMenuClose}
            onClearRequest={onClearRequest}
          />
        </div>
      </div>
    </div>
  );
}
