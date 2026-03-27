import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-primary-500" />,
};

const BG = {
  success: 'border-emerald-200 dark:border-emerald-800',
  error: 'border-red-200 dark:border-red-800',
  warning: 'border-amber-200 dark:border-amber-800',
  info: 'border-primary-200 dark:border-primary-800',
};

export default function Toast({ message, type = 'info' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -16 }}
      className={`pointer-events-none fixed left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)',
      }}
    >
      <div
        className={`flex items-center gap-3 rounded-[24px] border ${BG[type] || BG.info} bg-white/95 px-4 py-3 shadow-[0_22px_48px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:bg-surface-900/94`}
      >
        {ICONS[type] || ICONS.info}
        <p className="text-sm font-medium text-[var(--text)] flex-1">{message}</p>
      </div>
    </motion.div>
  );
}
