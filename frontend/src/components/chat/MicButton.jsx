import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useUIStore } from '../../store/index.js';

export default function MicButton({
  onStart,
  onStop,
  disabled,
  size = 'default',
  showStatus = true,
}) {
  const { isRecording, isProcessingSTT, isProcessingAI, isPlayingAudio } = useUIStore();

  const isLoading = isProcessingSTT || isProcessingAI;
  const isInline = size === 'inline';
  const buttonSizeClass = isInline ? 'w-14 h-14 rounded-2xl' : 'w-16 h-16 rounded-full';
  const iconSize = isInline ? 26 : 24;
  const ringShapeClass = isInline ? 'rounded-2xl' : 'rounded-full';

  function handleClick() {
    if (disabled || isLoading) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  }

  return (
    <div className={showStatus ? 'flex flex-col items-center gap-3' : 'flex items-center justify-center flex-shrink-0'}>
      {/* Status text */}
      {showStatus && (
        <p className="text-xs text-[var(--text-muted)] font-medium h-4 transition-all duration-200">
          {isRecording && '🎙️ Tinglayapman...'}
          {isProcessingSTT && '⏳ Ovoz aniqlanmoqda...'}
          {isProcessingAI && '🤖 Javob tayyorlanmoqda...'}
          {isPlayingAudio && !isLoading && !isRecording && '🔊 Gapirmoqda...'}
          {!isRecording && !isLoading && !isPlayingAudio && 'Mikrofon tugmasini bosing'}
        </p>
      )}

      {/* Main mic button */}
      <div className="relative">
        {/* Ripple rings when recording */}
        {isRecording && (
          <>
            <div className={`absolute inset-0 ${ringShapeClass} bg-red-400/20 ripple-ring`} />
            <div className={`absolute inset-0 ${ringShapeClass} bg-red-400/10 ripple-ring`} style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isLoading}
          aria-label={isRecording ? 'Yozishni to‘xtatish' : 'Mikrofonni yoqish'}
          title={isRecording ? 'Yozishni to‘xtatish' : 'Mikrofonni yoqish'}
          className={`relative ${buttonSizeClass} flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg ${
            isRecording
              ? 'bg-red-500 recording-pulse shadow-red-200 dark:shadow-red-900'
              : isLoading
              ? 'bg-surface-200 dark:bg-surface-700 cursor-not-allowed'
              : 'bg-primary-500 hover:bg-primary-600 shadow-primary-200 dark:shadow-primary-900 shadow-glow'
          }`}
        >
          {isLoading ? (
            <Loader2 size={iconSize} className="text-surface-500 animate-spin" />
          ) : isRecording ? (
            <MicOff size={iconSize} className="text-white" />
          ) : (
            <Mic size={iconSize} className="text-white" />
          )}
        </button>
      </div>

      {/* Wave bars when recording */}
      {showStatus && isRecording && (
        <div className="flex items-center gap-1 h-5">
          {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5].map((h, i) => (
            <div
              key={i}
              className="wave-bar w-1 rounded-full bg-red-400"
              style={{
                height: `${h * 18}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
