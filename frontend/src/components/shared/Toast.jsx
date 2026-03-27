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
  success: 'border-slate-200 dark:border-[#334155]',
  error: 'border-slate-200 dark:border-[#334155]',
  warning: 'border-slate-200 dark:border-[#334155]',
  info: 'border-slate-200 dark:border-[#334155]',
};

export default function Toast({ message, type = 'info' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -16 }}
        className={`w-full max-w-sm transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div
          className={`flex items-center gap-3 rounded-[24px] border ${BG[type] || BG.info} bg-[#ffffff] px-4 py-3 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:bg-[#111827] dark:shadow-[0_18px_36px_-24px_rgba(2,6,23,0.42)]`}
        >
          {ICONS[type] || ICONS.info}
          <p className="flex-1 text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{message}</p>
        </div>
      </motion.div>
    </div>
  );
}
