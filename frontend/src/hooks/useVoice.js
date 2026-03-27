import { useRef, useCallback, useEffect } from 'react';
import { useUIStore } from '../store/index.js';
import { apiGet, apiPostFormData } from '../utils/api.js';

const STT_POLL_INTERVAL_MS = 1500;
const STT_MAX_POLL_ATTEMPTS = 40;

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

  const pollTranscript = useCallback(async (taskId) => {
    const normalizedTaskId = String(taskId || '').trim();
    if (!normalizedTaskId) return '';

    for (let attempt = 0; attempt < STT_MAX_POLL_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, STT_POLL_INTERVAL_MS));

      const result = await apiGet(`/stt/status/${encodeURIComponent(normalizedTaskId)}`);
      const transcript = typeof result?.text === 'string' ? result.text.trim() : '';
      const state = String(result?.state || '').toLowerCase();

      if (transcript) {
        return transcript;
      }

      if (state === 'completed' && !transcript) {
        throw new Error('Ovoz tanib bo\'lmadi, qayta urinib ko\'ring');
      }
    }

    throw new Error('STT hali tayyor emas, birozdan keyin qayta urinib ko‘ring');
  }, []);

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
            const taskId = typeof result?.taskId === 'string' ? result.taskId.trim() : '';

            if (result.success && transcript) {
              resolve(transcript);
            } else if (result.success && taskId) {
              const polledTranscript = await pollTranscript(taskId);
              if (polledTranscript) {
                resolve(polledTranscript);
              } else {
                showToast('Ovoz tanib bo\'lmadi, qayta urinib ko\'ring', 'error');
                resolve(null);
              }
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
    [pollTranscript, setProcessingSTT, setRecording, showToast, stopStream, transcribeWithBackend]
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
