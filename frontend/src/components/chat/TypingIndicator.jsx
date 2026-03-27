import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
        <span className="text-white text-xs font-bold">K</span>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 inline-block" />
        </div>
      </div>
    </div>
  );
}
