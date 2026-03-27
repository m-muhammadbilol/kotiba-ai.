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

function getAudioContextCtor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function encodeWav(audioBuffer) {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = audioBuffer.length;
  const blockAlign = numberOfChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: numberOfChannels }, (_, index) =>
    audioBuffer.getChannelData(index)
  );

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < numberOfChannels; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channelIndex][sampleIndex] || 0));
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, pcm, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function convertBlobToWav(blob) {
  if (!blob || !blob.size) {
    throw new Error('Audio blob bo‘sh');
  }

  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) {
    throw new Error('AudioContext qo‘llab-quvvatlanmaydi');
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContextCtor();

  try {
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return encodeWav(decodedBuffer);
  } finally {
    if (typeof audioContext.close === 'function') {
      await audioContext.close().catch(() => {});
    }
  }
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

  const prepareSttBlob = useCallback(async (blob, mimeType) => {
    const normalizedMimeType = normalizeMimeType(mimeType);

    if (normalizedMimeType === 'audio/wav') {
      return { blob, mimeType: normalizedMimeType };
    }

    try {
      console.log('[STT] wav:convert:start', {
        sourceMimeType: normalizedMimeType,
        sourceSize: blob.size,
      });

      const wavBlob = await convertBlobToWav(blob);

      console.log('[STT] wav:convert:done', {
        sourceMimeType: normalizedMimeType,
        targetMimeType: 'audio/wav',
        sourceSize: blob.size,
        targetSize: wavBlob.size,
      });

      return { blob: wavBlob, mimeType: 'audio/wav' };
    } catch (error) {
      console.warn('[STT] wav:convert:failed', {
        sourceMimeType: normalizedMimeType,
        message: error?.message || 'unknown error',
      });

      return { blob, mimeType: normalizedMimeType };
    }
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
            const preparedAudio = await prepareSttBlob(blob, mimeType);
            const result = await transcribeWithBackend(
              preparedAudio.blob,
              preparedAudio.mimeType,
              durationSeconds
            );
            const transcript = typeof result?.text === 'string' ? result.text.trim() : '';

            console.log('[STT] request:done', {
              success: result?.success,
              state: result?.state,
              hasText: Boolean(transcript),
              mimeType: preparedAudio.mimeType,
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
              details: err?.data?.details,
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
    [prepareSttBlob, setProcessingSTT, setRecording, showToast, stopStream, transcribeWithBackend]
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
