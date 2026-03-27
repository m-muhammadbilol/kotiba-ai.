import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mic, SendHorizontal } from 'lucide-react';
import RecordingState from './RecordingState.jsx';

const MIN_TEXTAREA_HEIGHT = 22;
const MAX_TEXTAREA_HEIGHT = 72;

function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onMicStart,
  onMicStop,
  onMicCancel,
  disabled = false,
  isRecording = false,
  isProcessingSTT = false,
  isSending = false,
  isPlayingAudio = false,
}) {
  const shellRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const hasText = value.trim().length > 0;
  const isBusy = disabled || isProcessingSTT || isSending;
  const textareaDisabled = isBusy || isRecording || isProcessingSTT;
  const micDisabled = disabled || isSending;

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return undefined;
    }

    const startedAt = Date.now();
    setRecordingSeconds(0);

    const intervalId = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecording]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '22px';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(MIN_TEXTAREA_HEIGHT, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  useEffect(() => {
    const root = document.documentElement;
    const shell = shellRef.current;
    if (!shell) return undefined;

    const updateHeight = () => {
      root.style.setProperty('--chat-composer-height', `${shell.offsetHeight}px`);
    };

    updateHeight();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateHeight)
      : null;

    observer?.observe(shell);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
      root.style.removeProperty('--chat-composer-height');
    };
  }, []);

  function handleTextareaChange(event) {
    onChange(event.target.value);
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    if (!hasText || isBusy || isRecording) return;
    onSend();
  }

  function handleMicClick() {
    if (micDisabled || isProcessingSTT) return;
    onMicStart();
  }

  const textareaGlow = isFocused
    ? '0 0 0 1px rgba(99,102,241,0.16)'
    : '0 0 0 0 rgba(0,0,0,0)';

  const actionMode = isSending
    ? 'sending'
    : hasText
    ? 'send'
    : 'mic';

  return (
    <div className="chat-input-anchor">
      <motion.div
        ref={shellRef}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="pointer-events-auto"
      >
        <motion.div
          animate={{
            opacity: disabled && !isRecording ? 0.82 : 1,
          }}
          className="rounded-[20px] border border-slate-200/90 bg-white/98 px-2.5 py-2 shadow-[0_10px_22px_-20px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-[#1f2937]/98 dark:shadow-[0_10px_18px_-16px_rgba(2,6,23,0.45)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isRecording || isProcessingSTT ? (
              <RecordingState
                key={isRecording ? 'recording' : 'processing'}
                mode={isRecording ? 'recording' : 'processing'}
                durationLabel={formatDuration(recordingSeconds)}
                onCancel={onMicCancel}
                onSubmit={onMicStop}
              />
            ) : (
              <motion.div
                key="composer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-end gap-2"
              >
                <motion.div
                  animate={{
                    boxShadow: textareaGlow,
                  }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex min-h-[36px] flex-1 items-center rounded-[14px] bg-slate-50/75 px-2.5 py-1.5 dark:bg-surface-800/72"
                >
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Xabar yozing..."
                    rows={1}
                    disabled={textareaDisabled}
                    className="max-h-[72px] min-h-[20px] w-full resize-none border-0 bg-transparent px-0 py-0 text-[14px] leading-5 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-surface-50 dark:placeholder:text-surface-400"
                  />
                </motion.div>

                <motion.button
                  layout
                  type="button"
                  onClick={actionMode === 'send' ? onSend : handleMicClick}
                  disabled={(actionMode === 'send' && (!hasText || isBusy)) || (actionMode !== 'send' && micDisabled)}
                  whileTap={{ scale: 0.92 }}
                  animate={actionMode === 'mic' ? { scale: isFocused ? 1.03 : 1 } : { scale: 1 }}
                  aria-label={actionMode === 'send' ? 'Xabarni yuborish' : 'Ovoz yozishni boshlash'}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    actionMode === 'send'
                      ? 'bg-primary-500 text-white shadow-[0_10px_20px_-14px_rgba(99,102,241,0.58)]'
                      : actionMode === 'sending'
                        ? 'bg-slate-100 text-slate-500 dark:bg-surface-800 dark:text-surface-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                  }`}
                >
                  {actionMode === 'sending' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : actionMode === 'send' ? (
                    <SendHorizontal size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
