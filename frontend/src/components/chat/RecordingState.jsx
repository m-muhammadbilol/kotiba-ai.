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
      className="flex min-h-[36px] items-center gap-2"
    >
      {isRecording ? (
        <>
          <div className="flex min-w-[74px] items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 recording-pulse" />
            <span className="text-[13px] font-semibold tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {durationLabel}
            </span>
          </div>

          <div className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 py-1.5 dark:border-[#334155] dark:bg-[#0F172A]">
            <div className="flex items-center gap-2">
              <VoiceWaveform tone="recording" />
              <span className="truncate text-[12px] font-medium text-[#6B7280] dark:text-[#CBD5E1]">
                Gapiring, tushunib olyapman...
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={onCancel}
            whileTap={{ scale: 0.94 }}
            aria-label="Yozishni bekor qilish"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280] transition-colors hover:bg-[#E5E7EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B]"
          >
            <X size={16} />
          </motion.button>

          <motion.button
            type="button"
            onClick={onSubmit}
            whileTap={{ scale: 0.94 }}
            aria-label="Ovozni yuborish"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600"
          >
            <SendHorizontal size={15} />
          </motion.button>
        </>
      ) : (
        <>
          <div className="flex min-w-[126px] items-center gap-2">
            <Loader2 size={15} className="animate-spin text-primary-500" />
            <span className="truncate text-[13px] font-semibold text-[#111827] dark:text-[#F8FAFC]">
              Buyruqni tushunyapman...
            </span>
          </div>

          <div className="flex-1 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 py-1.5 dark:border-[#334155] dark:bg-[#0F172A]">
            <VoiceWaveform tone="processing" />
          </div>
        </>
      )}
    </motion.div>
  );
}
