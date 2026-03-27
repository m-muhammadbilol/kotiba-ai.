import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor qilish',
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        className="w-full max-w-sm rounded-[30px] bg-white/96 p-6 shadow-[0_32px_80px_-34px_rgba(15,23,42,0.42)] dark:bg-surface-900/96"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text)] mb-1">{title}</h3>
            <p className="text-sm text-[var(--text-muted)]">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 btn-ghost text-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 text-sm font-semibold rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-95 ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
