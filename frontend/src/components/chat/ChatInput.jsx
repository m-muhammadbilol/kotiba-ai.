import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mic, SendHorizontal, StopCircle } from 'lucide-react';
import RecordingIndicator from './RecordingIndicator.jsx';

const MIN_TEXTAREA_HEIGHT = 56;
const MAX_TEXTAREA_HEIGHT = 132;

function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getStatusText({ isRecording, isProcessingSTT, isSending, isPlayingAudio, hasText, disabled, recordingSeconds }) {
  if (isRecording) return `Eshitayapman... ${formatDuration(recordingSeconds)}`;
  if (isProcessingSTT) return 'Ovozingiz matnga aylantirilmoqda...';
  if (isSending) return 'Javob tayyorlanmoqda...';
  if (isPlayingAudio) return 'Kotiba javobni ovozda aytmoqda...';
  if (disabled) return 'Hozircha yozish vaqtincha yopiq.';
  if (hasText) return 'Xabar yuborishga tayyor.';
  return 'Xabar yozing...';
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onMicStart,
  onMicStop,
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
  const textareaDisabled = isBusy || isRecording;
  const micDisabled = disabled || isSending;
  const composerState = isRecording
    ? 'recording'
    : isProcessingSTT
    ? 'processing'
    : isSending
    ? 'sending'
    : hasText
    ? 'typing'
    : 'idle';
  const statusText = getStatusText({
    isRecording,
    isProcessingSTT,
    isSending,
    isPlayingAudio,
    hasText,
    disabled,
    recordingSeconds,
  });

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

    textarea.style.height = '0px';
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

    if (isRecording) {
      onMicStop();
      return;
    }

    onMicStart();
  }

  const textareaGlow = isRecording
    ? '0 0 0 1px rgba(248,113,113,0.22), 0 20px 44px -30px rgba(248,113,113,0.35)'
    : isFocused
    ? '0 0 0 1px rgba(99,102,241,0.26), 0 20px 48px -32px rgba(99,102,241,0.28)'
    : hasText
    ? '0 0 0 1px rgba(99,102,241,0.18), 0 16px 36px -28px rgba(15,23,42,0.2)'
    : '0 12px 32px -26px rgba(15,23,42,0.16)';

  const actionMode = isProcessingSTT
    ? 'processing'
    : isSending
    ? 'sending'
    : isRecording
    ? 'recording'
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
          className="rounded-[30px] border border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-2xl shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)] supports-[backdrop-filter]:bg-white/82 dark:border-surface-700/80 dark:bg-surface-900/88 dark:shadow-[0_28px_70px_-30px_rgba(2,6,23,0.82)]"
        >
          <AnimatePresence initial={false}>
            {(isRecording || isProcessingSTT) && (
              <RecordingIndicator
                state={isRecording ? 'recording' : 'processing'}
                statusText={isRecording ? `Gapiring, yozib olyapman... ${formatDuration(recordingSeconds)}` : 'Ovozingiz qayta ishlanayapti...'}
                secondaryText={isRecording ? 'Yuborish uchun mikrofonni yana bosing' : 'Biroz kuting, matnga aylantirayapman'}
              />
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <motion.div
              animate={{
                y: isFocused ? -1 : 0,
                boxShadow: textareaGlow,
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 rounded-[24px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-surface-700 dark:bg-surface-950/72"
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isRecording ? 'Gapiring, yozib olyapman...' : 'Xabar yozing...'}
                rows={1}
                disabled={textareaDisabled}
                className="max-h-[132px] min-h-[56px] w-full resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-surface-50 dark:placeholder:text-surface-400"
              />
            </motion.div>

            <motion.button
              layout
              type="button"
              onClick={actionMode === 'send' ? onSend : handleMicClick}
              disabled={(actionMode === 'send' && (!hasText || isBusy || isRecording)) || (actionMode !== 'send' && (micDisabled || isProcessingSTT))}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isRecording ? [1, 1.06, 1] : 1,
                boxShadow: isRecording
                  ? [
                      '0 0 0 0 rgba(248,113,113,0.0)',
                      '0 0 0 10px rgba(248,113,113,0.14)',
                      '0 0 0 0 rgba(248,113,113,0.0)',
                    ]
                  : '0 14px 30px -18px rgba(99,102,241,0.45)',
              }}
              transition={{
                duration: isRecording ? 1.8 : 0.2,
                repeat: isRecording ? Infinity : 0,
                ease: 'easeInOut',
              }}
              aria-label={
                actionMode === 'send'
                  ? 'Xabarni yuborish'
                  : isRecording
                  ? 'Ovoz yozishni to‘xtatish'
                  : 'Ovoz yozishni boshlash'
              }
              className={`relative mb-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${
                actionMode === 'recording'
                  ? 'bg-[linear-gradient(135deg,#fb7185,#ef4444)]'
                  : actionMode === 'processing'
                  ? 'bg-[linear-gradient(135deg,#38bdf8,#2563eb)]'
                  : actionMode === 'send'
                  ? 'bg-[linear-gradient(135deg,#4f8cff,#2563eb)]'
                  : 'bg-[linear-gradient(135deg,#7c86ff,#5b5ff6)]'
              }`}
            >
              {isRecording && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-red-400/20"
                  animate={{ scale: [1, 1.18], opacity: [0.42, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              {actionMode === 'processing' || actionMode === 'sending' ? (
                <Loader2 size={22} className="animate-spin" />
              ) : actionMode === 'recording' ? (
                <StopCircle size={22} />
              ) : actionMode === 'send' ? (
                <SendHorizontal size={21} />
              ) : (
                <Mic size={22} />
              )}
            </motion.button>
          </div>

          <motion.div
            animate={{
              opacity: statusText ? 1 : 0.7,
              y: composerState === 'recording' ? [0, -1, 0] : 0,
            }}
            transition={{
              duration: composerState === 'recording' ? 1.4 : 0.2,
              repeat: composerState === 'recording' ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className="px-2 pt-3 text-left text-[12px] font-medium tracking-[0.01em] text-slate-500 dark:text-surface-400"
          >
            {statusText}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
