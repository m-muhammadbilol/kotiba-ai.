import { useRef, useCallback, useEffect } from 'react';
import { useUIStore } from '../store/index.js';
import { apiPostFormData } from '../utils/api.js';

function normalizeMimeType(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return 'audio/webm';
  return mimeType.split(';')[0].trim().toLowerCase() || 'audio/webm';
}

function getFileExtension(mimeType) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  if (normalizedMimeType.includes('ogg')) return 'ogg';
  if (normalizedMimeType.includes('mp4')) return 'mp4';
  if (normalizedMimeType.includes('mpeg')) return 'mp3';
  if (normalizedMimeType.includes('wav')) return 'wav';
  return 'webm';
}

export function useVoice() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const stopModeRef = useRef('send');

  const { setRecording, setProcessingSTT, showToast } = useUIStore();

  const unlockAudioContext = useCallback(() => {}, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const transcribeWithBackend = useCallback(
    async (blob, mimeType) => {
      const formData = new FormData();
      const normalizedMimeType = normalizeMimeType(mimeType);
      const extension = getFileExtension(normalizedMimeType);
      formData.append('file', blob, `recording.${extension}`);
      return apiPostFormData('/stt', formData);
    },
    []
  );

  const startRecording = useCallback(async () => {
    unlockAudioContext();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Mikrofon ushbu brauzerda qo\'llab-quvvatlanmaydi', 'error');
      return false;
    }

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      stopModeRef.current = 'send';

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
        setRecording(false);
        stopStream();
        showToast('Ovoz yozish vaqtida xato yuz berdi', 'error');
      };

      recorder.start();
      setRecording(true);
      return true;
    } catch (err) {
      console.error('[MICROPHONE ERROR]', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Mikrofon ruxsati berilmagan. Brauzer sozlamalarini tekshiring.', 'error');
      } else if (err.name === 'NotFoundError') {
        showToast('Mikrofon topilmadi. Qurilmangizni tekshiring.', 'error');
      } else {
        showToast('Mikrofon ishga tushmadi: ' + err.message, 'error');
      }
      return false;
    }
  }, [unlockAudioContext, setRecording, showToast, stopStream]);

  const finalizeRecording = useCallback(
    (mode = 'send') =>
      new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;

        if (!recorder || recorder.state === 'inactive') {
          stopStream();
          chunksRef.current = [];
          mediaRecorderRef.current = null;
          stopModeRef.current = 'send';
          setRecording(false);
          resolve(null);
          return;
        }

        stopModeRef.current = mode;

        recorder.onstop = async () => {
          const currentMode = stopModeRef.current;
          setRecording(false);
          stopStream();
          mediaRecorderRef.current = null;
          stopModeRef.current = 'send';

          if (currentMode === 'cancel') {
            chunksRef.current = [];
            resolve(null);
            return;
          }

          if (chunksRef.current.length === 0) {
            chunksRef.current = [];
            showToast('Ovoz yozilmadi', 'warning');
            resolve(null);
            return;
          }

          const mimeType = normalizeMimeType(recorder.mimeType || 'audio/webm');
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];

          if (blob.size < 1000) {
            showToast('Ovoz juda qisqa yoki eshitilmadi', 'warning');
            resolve(null);
            return;
          }

          setProcessingSTT(true);

          try {
            const result = await transcribeWithBackend(blob, mimeType);
            const transcript = typeof result?.text === 'string' ? result.text.trim() : '';

            if (result.success && transcript) {
              resolve(transcript);
            } else {
              showToast('Ovoz tanib bo\'lmadi, qayta urinib ko\'ring', 'error');
              resolve(null);
            }
          } catch (err) {
            console.error('[STT ERROR]', err);
            showToast(err.message || 'Server STT ishlamadi. Qayta urinib ko\'ring.', 'error');
            resolve(null);
          } finally {
            setProcessingSTT(false);
          }
        };

        recorder.stop();
      }),
    [setProcessingSTT, setRecording, showToast, stopStream, transcribeWithBackend]
  );

  const stopRecording = useCallback(() => finalizeRecording('send'), [finalizeRecording]);

  const cancelRecording = useCallback(() => finalizeRecording('cancel'), [finalizeRecording]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return { startRecording, stopRecording, cancelRecording, unlockAudioContext };
}

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}
