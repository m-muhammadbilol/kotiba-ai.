import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, SendHorizontal, X } from 'lucide-react';
import VoiceWaveform from './VoiceWaveform.jsx';

export default function RecordingState({
  mode = 'recording',
  durationLabel = '00:00',
  onCancel,
  onSubmit,
}) {
  const isRecording = mode === 'recording';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex min-h-[40px] items-center gap-2"
    >
      {isRecording ? (
        <>
          <div className="flex min-w-[78px] items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.14)]" />
            <span className="text-[14px] font-medium tabular-nums text-slate-800 dark:text-surface-100">
              {durationLabel}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <VoiceWaveform tone="recording" />
          </div>

          <motion.button
            type="button"
            onClick={onCancel}
            whileTap={{ scale: 0.94 }}
            aria-label="Yozishni bekor qilish"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <X size={18} />
          </motion.button>

          <motion.button
            type="button"
            onClick={onSubmit}
            whileTap={{ scale: 0.94 }}
            aria-label="Ovozni yuborish"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600"
          >
            <SendHorizontal size={17} />
          </motion.button>
        </>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary-500" />
            <span className="truncate text-[14px] font-medium text-slate-700 dark:text-surface-200">
              Ovoz matnga aylantirilmoqda...
            </span>
          </div>

          <div className="flex-1">
            <VoiceWaveform tone="processing" />
          </div>
        </>
      )}
    </motion.div>
  );
}
