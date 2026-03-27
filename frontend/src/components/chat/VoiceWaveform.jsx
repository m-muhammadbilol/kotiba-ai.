import React from 'react';
import { motion } from 'framer-motion';

const BARS = [10, 14, 8, 16, 11, 7, 13, 9, 15, 10, 6, 12];

export default function VoiceWaveform({ tone = 'recording' }) {
  const barClass =
    tone === 'recording'
      ? 'bg-slate-500 dark:bg-[#CBD5E1]'
      : 'bg-slate-400 dark:bg-[#94A3B8]';

  return (
    <div className="flex h-5 items-center gap-[3px] overflow-hidden">
      {BARS.map((height, index) => (
        <motion.span
          key={index}
          className={`w-1 rounded-full ${barClass}`}
          style={{ height }}
          animate={{ scaleY: tone === 'recording' ? [0.42, 1, 0.58, 0.92, 0.5] : [0.3, 0.48, 0.35] }}
          transition={{
            duration: tone === 'recording' ? 0.85 : 1.25,
            repeat: Infinity,
            delay: index * 0.04,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
