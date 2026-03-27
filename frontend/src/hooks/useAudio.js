import { useRef, useCallback } from 'react';
import { useUIStore, useSettingsStore } from '../store/index.js';
import { apiPostAudio } from '../utils/api.js';

export function useAudio() {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const { setPlayingAudio, showToast } = useUIStore();
  const { settings } = useSettingsStore();

  const stopNativeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopSpeechSynthesis = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }, []);

  const supportsBrowserTts = useCallback(() => {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined'
    );
  }, []);

  const findBestVoice = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    return (
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('uz')) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('tr')) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('ru')) ||
      voices[0]
    );
  }, []);

  const playWithBrowserTts = useCallback(
    (text) =>
      new Promise((resolve, reject) => {
        if (!supportsBrowserTts()) {
          reject(new Error('Brauzer TTS qo\'llab-quvvatlanmaydi'));
          return;
        }

        stopNativeAudio();
        stopSpeechSynthesis();

        const utterance = new window.SpeechSynthesisUtterance(text);
        const bestVoice = findBestVoice();
        if (bestVoice) utterance.voice = bestVoice;
        utterance.lang = bestVoice?.lang || 'uz-UZ';
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => setPlayingAudio(true);
        utterance.onend = () => {
          setPlayingAudio(false);
          resolve();
        };
        utterance.onerror = () => {
          setPlayingAudio(false);
          reject(new Error('Brauzer TTS xatosi'));
        };

        window.speechSynthesis.speak(utterance);
      }),
    [findBestVoice, setPlayingAudio, stopNativeAudio, stopSpeechSynthesis, supportsBrowserTts]
  );

  const playText = useCallback(
    async (text, model, options = {}) => {
      if (!settings.ttsEnabled) return;
      if (!text || text.trim().length === 0) return;

      try {
        const blob = await apiPostAudio('/tts', {
          text,
          model: model || settings.ttsModel || 'lola',
        });

        stopNativeAudio();
        stopSpeechSynthesis();

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setPlayingAudio(true);
        audio.onended = () => {
          setPlayingAudio(false);
          stopNativeAudio();
        };
        audio.onerror = () => {
          setPlayingAudio(false);
          stopNativeAudio();
        };

        try {
          await audio.play();
          return;
        } catch (err) {
          console.warn('[AUDIO AUTOPLAY]', err.message);
          setPlayingAudio(false);
          stopNativeAudio();
        }
      } catch (err) {
        console.error('[TTS ERROR]', err);
      }

      if (supportsBrowserTts()) {
        try {
          await playWithBrowserTts(text);
          return;
        } catch (browserErr) {
          console.error('[BROWSER TTS ERROR]', browserErr);
        }
      }

      setPlayingAudio(false);
      if (!options.silentFailure) {
        showToast('Ovozli javobni ijro etib bo\'lmadi', 'warning', { speak: false });
      }
    },
    [
      settings.ttsEnabled,
      settings.ttsModel,
      playWithBrowserTts,
      setPlayingAudio,
      showToast,
      stopNativeAudio,
      stopSpeechSynthesis,
      supportsBrowserTts,
    ]
  );

  const stopAudio = useCallback(() => {
    stopNativeAudio();
    stopSpeechSynthesis();
    setPlayingAudio(false);
  }, [setPlayingAudio, stopNativeAudio, stopSpeechSynthesis]);

  return { playText, stopAudio };
}
