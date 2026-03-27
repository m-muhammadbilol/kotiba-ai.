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
  const recordingStartedAtRef = useRef(0);

  const { setRecording, setProcessingSTT, showToast } = useUIStore();

  const unlockAudioContext = useCallback(() => {}, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const transcribeWithBackend = useCallback(async (blob, mimeType, durationSeconds) => {
    const formData = new FormData();
    const normalizedMimeType = normalizeMimeType(mimeType);
    const extension = getFileExtension(normalizedMimeType);

    formData.append('file', blob, `recording.${extension}`);
    formData.append('durationSeconds', String(durationSeconds || 0));

    console.log('[STT] request:start', {
      mimeType: normalizedMimeType,
      extension,
      blobSize: blob.size,
      durationSeconds,
    });

    return apiPostFormData('/stt', formData);
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
      recordingStartedAtRef.current = Date.now();

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);

      console.log('[VOICE] recorder:start', {
        requestedMimeType: mimeType || 'browser-default',
        streamTracks: stream.getAudioTracks().length,
      });

      mediaRecorderRef.current = recorder;
      stopModeRef.current = 'send';

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('[VOICE] recorder:chunk', {
            size: event.data.size,
            type: event.data.type,
          });
          chunksRef.current.push(event.data);
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
        showToast(`Mikrofon ishga tushmadi: ${err.message}`, 'error');
      }
      return false;
    }
  }, [setRecording, showToast, stopStream, unlockAudioContext]);

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
          const durationSeconds = recordingStartedAtRef.current
            ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
            : 0;

          setRecording(false);
          stopStream();
          mediaRecorderRef.current = null;
          stopModeRef.current = 'send';
          recordingStartedAtRef.current = 0;

          if (currentMode === 'cancel') {
            chunksRef.current = [];
            resolve(null);
            return;
          }

          if (chunksRef.current.length === 0) {
            chunksRef.current = [];
            showToast('Audio yuborilmadi', 'warning');
            resolve(null);
            return;
          }

          const mimeType = normalizeMimeType(recorder.mimeType || 'audio/webm');
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];

          console.log('[VOICE] recorder:stop', {
            stopMode: currentMode,
            mimeType,
            blobSize: blob.size,
            durationSeconds,
          });

          if (blob.size < 1000) {
            showToast('Ovoz juda qisqa yoki eshitilmadi', 'warning');
            resolve(null);
            return;
          }

          setProcessingSTT(true);

          try {
            const result = await transcribeWithBackend(blob, mimeType, durationSeconds);
            const transcript = typeof result?.text === 'string' ? result.text.trim() : '';

            console.log('[STT] request:done', {
              success: result?.success,
              state: result?.state,
              hasText: Boolean(transcript),
            });

            if (result.success && transcript) {
              resolve(transcript);
              return;
            }

            showToast('Ovoz matnga aylantirilmadi', 'error');
            resolve(null);
          } catch (err) {
            console.error('[STT ERROR]', {
              message: err?.message,
              status: err?.status,
              data: err?.data,
            });

            const errorMessage =
              err?.status === 415
                ? 'Audio formati qo‘llanmadi'
                : err?.status === 504
                  ? 'STT serveri javob bermadi'
                  : err?.status === 502
                    ? 'Ovoz matnga aylantirilmadi'
                    : err?.status >= 500
                      ? 'Serverda xatolik yuz berdi'
                      : err?.message || 'Server STT ishlamadi. Qayta urinib ko\'ring.';

            showToast(errorMessage, 'error');
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
