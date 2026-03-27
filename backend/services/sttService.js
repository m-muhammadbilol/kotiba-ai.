import fetch from 'node-fetch';
import FormData from 'form-data';
import { config } from '../config/index.js';

const EXTERNAL_FETCH_TIMEOUT_MS = 20000;
const BLOCKING_FETCH_TIMEOUT_MS = 90000;
const MAX_BLOCKING_AUDIO_SECONDS = 60;

function normalizeMimeType(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return 'audio/webm';
  return mimeType.split(';')[0].trim().toLowerCase() || 'audio/webm';
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function resolveFilename(filename, mimeType) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  if (filename && filename.includes('.')) return filename;
  if (normalizedMimeType.includes('ogg')) return 'recording.ogg';
  if (normalizedMimeType.includes('mp4')) return 'recording.mp4';
  if (normalizedMimeType.includes('mpeg')) return 'recording.mp3';
  if (normalizedMimeType.includes('wav')) return 'recording.wav';
  return 'recording.webm';
}

async function getMultipartHeaders(form) {
  const contentLength = await new Promise((resolve, reject) => {
    form.getLength((err, length) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(length);
    });
  });

  return {
    Authorization: config.uzbekVoiceApiKey,
    ...form.getHeaders(),
    'Content-Length': String(contentLength),
  };
}

function extractTranscript(payload) {
  const text =
    payload?.result?.text ||
    payload?.result?.conversation_text ||
    payload?.text ||
    payload?.result ||
    '';

  return typeof text === 'string' ? text.trim() : '';
}

function normalizeState(value) {
  return String(value || '').trim().toLowerCase();
}

function getPayloadState(payload) {
  return normalizeState(
    payload?.status ||
      payload?.state ||
      payload?.task_status ||
      payload?.result?.status ||
      payload?.result?.state
  );
}

function isCompletedState(state) {
  return ['success', 'completed', 'done', 'ready', 'finished'].includes(normalizeState(state));
}

function isFailedState(state) {
  return ['failure', 'failed', 'error', 'cancelled', 'canceled'].includes(normalizeState(state));
}

function resolveTaskId(payload) {
  return (
    payload?.task_id ||
    payload?.taskId ||
    payload?.id ||
    payload?.result?.task_id ||
    payload?.result?.id ||
    ''
  );
}

function buildPollingUrls(taskId) {
  const rawTaskId = String(taskId || '').trim();
  if (!rawTaskId) return [];

  const normalizedTaskId = rawTaskId.replace(/^\/+/, '');
  const apiRoot = config.uzbekVoiceBaseUrl.replace(/\/+$/, '');
  const apiOrigin = new URL(config.uzbekVoiceBaseUrl).origin;
  const hasApiPrefix = normalizedTaskId.startsWith('api/');
  const hasSttPrefix = normalizedTaskId.startsWith('stt/');

  return dedupe([
    /^https?:\/\//i.test(rawTaskId) ? rawTaskId : null,
    hasApiPrefix ? `${apiOrigin}/${normalizedTaskId}` : null,
    hasSttPrefix ? `${apiRoot}/${normalizedTaskId}` : null,
    !hasApiPrefix && !hasSttPrefix ? `${apiRoot}/stt/${normalizedTaskId}` : null,
    !hasApiPrefix && !hasSttPrefix ? `${apiRoot}/${normalizedTaskId}` : null,
  ]);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutError = new Error('STT serveridan javob kechikdi');
      timeoutError.status = 504;
      timeoutError.details = `${url} ${timeoutMs}ms ichida javob bermadi`;
      throw timeoutError;
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchPollingData(taskId) {
  const pollingUrls = buildPollingUrls(taskId);

  for (const pollingUrl of pollingUrls) {
    console.log('[STT] poll:fetch', { taskId, pollingUrl });
    const pollRes = await fetchWithTimeout(pollingUrl, {
      headers: {
        Authorization: config.uzbekVoiceApiKey,
      },
    });

    if (pollRes.ok) {
      return await pollRes.json();
    }

    if (pollRes.status === 404) {
      console.warn('[STT] poll:404', { taskId, pollingUrl });
      continue;
    }

    const errText = await pollRes.text();
    console.error('[STT] poll:error', {
      taskId,
      pollingUrl,
      status: pollRes.status,
      body: errText,
    });
    const error = new Error(`STT polling xatosi: ${pollRes.status} - ${errText || pollingUrl}`);
    error.status = pollRes.status;
    error.details = errText;
    throw error;
  }

  return null;
}

function normalizeInitResult(payload) {
  const text = extractTranscript(payload);
  const taskId = resolveTaskId(payload);
  const state = getPayloadState(payload);

  console.log('[STT] init:payload', {
    taskId,
    state,
    hasText: Boolean(text),
  });

  if (text) {
    return {
      state: 'completed',
      text,
      taskId,
    };
  }

  if (isFailedState(state)) {
    const error = new Error('STT aniqlashda xato yuz berdi');
    error.status = 502;
    throw error;
  }

  if (!taskId) {
    const error = new Error('STT task ID topilmadi');
    error.status = 502;
    throw error;
  }

  return {
    state: isCompletedState(state) ? 'completed' : 'processing',
    text: '',
    taskId,
  };
}

function normalizeStatusResult(payload, taskId) {
  const text = extractTranscript(payload);
  const state = getPayloadState(payload);

  console.log('[STT] poll:payload', {
    taskId,
    state,
    hasText: Boolean(text),
  });

  if (text) {
    return {
      state: 'completed',
      text,
      taskId: resolveTaskId(payload) || taskId,
    };
  }

  if (isFailedState(state)) {
    const error = new Error('STT aniqlashda xato yuz berdi');
    error.status = 502;
    throw error;
  }

  return {
    state: isCompletedState(state) ? 'completed' : 'processing',
    text: '',
    taskId: resolveTaskId(payload) || taskId,
  };
}

export const sttService = {
  async startTranscription({ audioBuffer, mimeType, filename, durationSeconds }) {
    if (!config.uzbekVoiceApiKey) {
      throw new Error('UzbekVoice API key sozlanmagan');
    }

    const form = new FormData();
    const normalizedMimeType = normalizeMimeType(mimeType);
    const normalizedDurationSeconds = Number.isFinite(Number(durationSeconds))
      ? Number(durationSeconds)
      : null;
    const shouldUseBlocking =
      normalizedDurationSeconds === null || normalizedDurationSeconds <= MAX_BLOCKING_AUDIO_SECONDS;
    const resolvedFilename = resolveFilename(filename, normalizedMimeType);

    console.log('[STT] init:start', {
      mimeType: normalizedMimeType,
      filename: resolvedFilename,
      size: audioBuffer?.length || 0,
      durationSeconds: normalizedDurationSeconds,
      blocking: shouldUseBlocking,
    });

    form.append('file', audioBuffer, {
      filename: resolvedFilename,
      contentType: normalizedMimeType,
    });
    form.append('language', 'uz');
    form.append('blocking', shouldUseBlocking ? 'true' : 'false');
    form.append('return_offsets', 'false');
    form.append('run_diarization', 'false');

    const initRes = await fetchWithTimeout(`${config.uzbekVoiceBaseUrl}/stt`, {
      method: 'POST',
      headers: await getMultipartHeaders(form),
      body: form,
    }, shouldUseBlocking ? BLOCKING_FETCH_TIMEOUT_MS : EXTERNAL_FETCH_TIMEOUT_MS);

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error('[STT] init:error', {
        status: initRes.status,
        body: errText,
      });
      const error = new Error(`STT boshlash xatosi: ${initRes.status} - ${errText}`);
      error.status = initRes.status;
      error.details = errText;
      throw error;
    }

    const initData = await initRes.json();

    console.log('[STT] init:raw', {
      blocking: shouldUseBlocking,
      state: getPayloadState(initData),
      taskId: resolveTaskId(initData),
      hasText: Boolean(extractTranscript(initData)),
    });

    if (shouldUseBlocking) {
      const transcript = extractTranscript(initData);
      const state = getPayloadState(initData);

      if (transcript) {
        return {
          state: 'completed',
          text: transcript,
          taskId: resolveTaskId(initData),
        };
      }

      if (isFailedState(state)) {
        const error = new Error('STT serveridan xato qaytdi');
        error.status = 502;
        error.details = JSON.stringify(initData);
        throw error;
      }

      const error = new Error('STT matn qaytarmadi');
      error.status = 502;
      error.details = JSON.stringify(initData);
      throw error;
    }

    return normalizeInitResult(initData);
  },

  async getTranscriptionStatus(taskId) {
    if (!config.uzbekVoiceApiKey) {
      throw new Error('UzbekVoice API key sozlanmagan');
    }

    console.log('[STT] poll:start', { taskId });
    const pollData = await fetchPollingData(taskId);
    if (!pollData) {
      console.log('[STT] poll:not-ready', { taskId });
      return {
        state: 'processing',
        text: '',
        taskId,
      };
    }

    return normalizeStatusResult(pollData, taskId);
  },
};
