import React from 'react';
import ChatBubble from './ChatBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const QUICK_HINTS = [
  'Ertaga soat 9 da uchrashuv bor',
  '50,000 so\'m non oldim',
  'Hisobot yozish kerak',
  'Soat necha bo‘ldi?',
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
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
            Salom{userName ? `, ${userTitle ? `${userTitle} ` : ''}${userName}` : ''}!
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--text-muted)]">
            Men <strong className="text-[var(--text)]">{aiName || 'Kotiba'}</strong>. Gapiring, yozing yoki pastdagi tezkor takliflardan birini tanlang.
          </p>

          <div className="mt-7 grid w-full gap-2.5">
            {QUICK_HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => onHintClick(hint)}
                className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-left text-sm font-medium text-[var(--text)] shadow-[0_16px_36px_-28px_rgba(15,23,42,0.32)] transition-transform hover:-translate-y-0.5 dark:border-surface-700 dark:bg-surface-800/92"
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
