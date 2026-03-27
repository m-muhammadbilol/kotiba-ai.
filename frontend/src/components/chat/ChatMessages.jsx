import React from 'react';
import { Bell, HelpCircle, Zap } from 'lucide-react';
import ChatBubble from './ChatBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const MODE_HINTS = [
  { label: 'Eslatma', Icon: Bell },
  { label: 'Buyruq', Icon: Zap },
  { label: 'Savol', Icon: HelpCircle },
];

const QUICK_HINTS = [
  '1 minutdan keyin suv ichishni eslat',
  'Ertaga 9 da uchrashuv qo‘sh',
  'Qorong‘u rejimni yoq',
  'Bugungi xarajatlarimni ko‘rsat',
];

export default function ChatMessages({
  messages,
  aiName,
  userName,
  userTitle,
  isProcessingAI,
  onHintClick,
  bottomRef,
}) {
  return (
    <div className="chat-scroll-area flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center px-6 pb-10 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-[radial-gradient(circle_at_top,#8aa2ff,transparent_58%),linear-gradient(135deg,#5b5ff6,#2f6df6)] shadow-[0_28px_60px_-28px_rgba(47,109,246,0.48)]">
            <span className="text-4xl font-black text-white">K</span>
          </div>
          <div className="mb-3 rounded-full border border-primary-100 bg-primary-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-primary-300">
            Tushunadi • Ajratadi • Bajaradi
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
            Salom{userName ? `, ${userTitle ? `${userTitle} ` : ''}${userName}` : ''}!
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--text-muted)]">
            Men <strong className="text-[var(--text)]">{aiName || 'Kotiba'}</strong>. Niyatingizni tushunaman, kerakli ma'lumotni ajrataman va amaliy javob beraman.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {MODE_HINTS.map(({ label, Icon }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] dark:border-surface-700/90 dark:bg-surface-800/96 dark:text-surface-100"
              >
                <Icon size={12} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 grid w-full gap-2.5">
            {QUICK_HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => onHintClick(hint)}
                className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.32)] transition-transform hover:-translate-y-0.5 dark:border-surface-700/90 dark:bg-surface-800/96 dark:text-surface-100"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}

      {isProcessingAI && <TypingIndicator />}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
