import React from 'react';
import { motion } from 'framer-motion';

const BARS = [8, 12, 9, 16, 11, 7, 14, 10, 13, 8];

export default function VoiceWaveform({ tone = 'recording' }) {
  const barClass =
    tone === 'recording'
      ? 'bg-slate-300 dark:bg-surface-500'
      : 'bg-slate-200 dark:bg-surface-600';

  return (
    <div className="flex h-6 items-center gap-1 overflow-hidden">
      {BARS.map((height, index) => (
        <motion.span
          key={index}
          className={`w-1 rounded-full ${barClass}`}
          style={{ height }}
          animate={{ scaleY: tone === 'recording' ? [0.5, 1, 0.65, 0.95, 0.55] : [0.35, 0.55, 0.4] }}
          transition={{
            duration: tone === 'recording' ? 0.95 : 1.4,
            repeat: Infinity,
            delay: index * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
