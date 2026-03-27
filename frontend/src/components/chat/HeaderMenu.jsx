import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function HeaderMenu({ isOpen, onClose, onClearRequest }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Menyuni yopish"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-transparent"
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-11 z-50 min-w-[210px] overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-2 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-surface-700 dark:bg-surface-900/95"
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                onClearRequest();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                <Trash2 size={16} />
              </span>
              <span className="text-red-500">Chatni tozalash</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
