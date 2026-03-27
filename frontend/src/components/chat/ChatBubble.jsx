import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, Bell, Wallet, Calendar, SlidersHorizontal, BarChart3 } from 'lucide-react';
import { formatChatTime, formatDateTime, formatMoney } from '../../utils/time.js';
import { useSettingsStore } from '../../store/index.js';

const TYPE_CONFIG = {
  reminder: { Icon: Bell, label: 'Eslatma qo\'shildi', color: 'text-violet-500', bg: 'bg-violet-50/90 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/40' },
  task: { Icon: CheckSquare, label: 'Vazifa qo\'shildi', color: 'text-emerald-500', bg: 'bg-emerald-50/90 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40' },
  meeting: { Icon: Calendar, label: 'Uchrashuv qo\'shildi', color: 'text-blue-500', bg: 'bg-blue-50/90 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40' },
  money: { Icon: Wallet, label: 'Xarajat qo\'shildi', color: 'text-amber-500', bg: 'bg-amber-50/90 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40' },
  settings: { Icon: SlidersHorizontal, label: 'Sozlama yangilandi', color: 'text-sky-500', bg: 'bg-sky-50/90 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/40' },
  report: { Icon: BarChart3, label: 'Hisobot tayyorlandi', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50/90 border-fuchsia-100 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/40' },
};

function ActionCard({ type, data }) {
  const config = TYPE_CONFIG[type];
  if (!config || !data) return null;
  const { Icon, label, color, bg } = config;

  if (type === 'report') {
    const rows = Array.isArray(data.table) ? data.table.slice(0, 3) : [];

    return (
      <div className={`mt-2 rounded-3xl border p-4 ${bg}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white ${color}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-[0.08em] ${color}`}>{label}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {data.range === 'daily' ? 'Kunlik' : data.range === 'yearly' ? 'Yillik' : 'Oylik'} ko‘rinish
            </p>
            {rows.length > 0 && (
              <div className="mt-3 space-y-2">
                {rows.map((row, index) => (
                  <div key={`${row.category}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-xs dark:bg-surface-900/70">
                    <span className="font-medium text-slate-900 dark:text-surface-100">{row.category}</span>
                    <span className={`font-bold ${color}`}>{formatMoney(row.amount, row.currency || 'UZS')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'settings') {
    const settingRows = [
      data.theme ? `Mavzu: ${data.theme}` : null,
      data.user_name || data.userName ? `Murojaat: ${data.user_name || data.userName}` : null,
      data.fontSize ? `Shrift: ${data.fontSize}` : null,
      data.assistantRole ? `Rol: ${data.assistantRole}` : null,
      data.speechStyle ? `Muomala: ${data.speechStyle}` : null,
    ].filter(Boolean);

    return (
      <div className={`mt-2 rounded-3xl border p-4 ${bg}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white ${color} dark:bg-surface-900/80`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-[0.08em] ${color}`}>{label}</p>
            <div className="mt-2 space-y-1.5">
              {settingRows.map((row) => (
                <p key={row} className="text-xs font-medium text-slate-900 dark:text-surface-100">{row}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-2 flex items-start gap-2.5 rounded-3xl border p-4 ${bg}`}>
      <Icon size={16} className={`${color} mt-0.5 flex-shrink-0`} />
      <div className="min-w-0">
        <p className={`mb-0.5 text-xs font-semibold ${color}`}>{label}</p>
        <p className="text-xs font-medium text-slate-900 dark:text-surface-100 truncate">{data.title || data.note || ''}</p>
        {(data.dueTime || data.time) && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            <Clock size={10} className="inline mr-1" />
            {formatDateTime(data.dueTime || data.time)}
          </p>
        )}
        {data.amount !== undefined && (
          <p className={`text-xs font-bold ${color}`}>
            {formatMoney(data.amount, data.currency)}
          </p>
        )}
      </div>
    </div>
  );
}

function extractVisibleText(content) {
  const rawText = typeof content === 'string' ? content.trim() : '';
  if (!rawText || !rawText.startsWith('{')) return rawText;

  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed?.text === 'string' && parsed.text.trim()) {
      return parsed.text.trim();
    }
  } catch {}

  const match = rawText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) return rawText;

  try {
    return JSON.parse(`"${match[1]}"`).trim();
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
  }
}

export default function ChatBubble({ message }) {
  const { settings } = useSettingsStore();
  const isUser = message.role === 'user';
  const isAI = message.role === 'assistant';
  const visibleContent = isAI ? extractVisibleText(message.content) : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`mb-4 flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {isAI && (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#5b5ff6,#2f6df6)] shadow-[0_14px_30px_-18px_rgba(47,109,246,0.55)]">
          <span className="text-white text-xs font-bold">K</span>
        </div>
      )}

      <div className={`flex max-w-[82%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-soft ${
          isUser
            ? 'rounded-br-lg bg-[linear-gradient(135deg,#5b5ff6,#3b82f6)] text-white shadow-[0_18px_40px_-24px_rgba(59,130,246,0.65)]'
            : 'rounded-bl-lg border border-slate-200/80 bg-white/96 text-slate-900 shadow-[0_22px_46px_-30px_rgba(15,23,42,0.22)] dark:border-surface-700/80 dark:bg-surface-800/96 dark:text-surface-50'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{visibleContent}</p>
        </div>

        {isAI && message.type && message.type !== 'chat' && message.data && (
          <div className="w-full">
            <ActionCard type={message.type} data={message.data} />
          </div>
        )}

        <span className="mt-1.5 px-1 text-[10px] font-medium text-[var(--text-muted)]/80">
          {formatChatTime(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[20px] bg-slate-200 dark:bg-surface-700">
          <span className="text-xs font-bold text-slate-600 dark:text-surface-200">
            {(settings.userName || 'U')[0].toUpperCase()}
          </span>
        </div>
      )}
    </motion.div>
  );
}
