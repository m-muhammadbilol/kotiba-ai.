import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const BAR_HEIGHTS = [12, 20, 28, 18, 26, 14];

export default function RecordingIndicator({ state, statusText, secondaryText }) {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`mb-3 rounded-[24px] border px-4 py-3 ${
        isRecording
          ? 'border-red-300/50 bg-[linear-gradient(135deg,rgba(254,242,242,0.92),rgba(255,255,255,0.75))] dark:border-red-900/40 dark:bg-[linear-gradient(135deg,rgba(69,10,10,0.52),rgba(31,41,55,0.55))]'
          : 'border-sky-300/40 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.8))] dark:border-sky-900/30 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.42),rgba(30,41,59,0.55))]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isRecording ? 'bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.95)]' : 'bg-sky-400'
              }`}
            />
            <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-surface-50">{statusText}</p>
          </div>
          {secondaryText && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-surface-300">{secondaryText}</p>
          )}
        </div>

        {isProcessing ? (
          <Loader2 size={18} className="shrink-0 animate-spin text-sky-500 dark:text-sky-300" />
        ) : (
          <div className="flex h-8 shrink-0 items-end gap-1.5">
            {BAR_HEIGHTS.map((height, index) => (
              <motion.span
                key={index}
                className="w-1.5 rounded-full bg-red-400 dark:bg-red-300"
                style={{ height }}
                animate={{ scaleY: [0.45, 1, 0.6, 0.9, 0.55] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.08,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
