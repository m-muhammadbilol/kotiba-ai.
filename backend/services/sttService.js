import fetch from 'node-fetch';
import FormData from 'form-data';
import { config } from '../config/index.js';

const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 1000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isCompletedState(state) {
  return ['success', 'completed', 'done'].includes((state || '').toLowerCase());
}

function isFailedState(state) {
  return ['failure', 'failed', 'error'].includes((state || '').toLowerCase());
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

async function fetchPollingData(taskId) {
  const pollingUrls = buildPollingUrls(taskId);

  for (const pollingUrl of pollingUrls) {
    const pollRes = await fetch(pollingUrl, {
      headers: {
        Authorization: config.uzbekVoiceApiKey,
      },
    });

    if (pollRes.ok) {
      return await pollRes.json();
    }

    if (pollRes.status === 404) {
      continue;
    }

    const errText = await pollRes.text();
    throw new Error(`STT polling xatosi: ${pollRes.status} - ${errText || pollingUrl}`);
  }

  return null;
}

export const sttService = {
  async transcribe({ audioBuffer, mimeType, filename }) {
    if (!config.uzbekVoiceApiKey) {
      throw new Error('UzbekVoice API key sozlanmagan');
    }

    const form = new FormData();
    const normalizedMimeType = normalizeMimeType(mimeType);
    form.append('file', audioBuffer, {
      filename: resolveFilename(filename, normalizedMimeType),
      contentType: normalizedMimeType,
    });
    form.append('language', 'uz');
    form.append('blocking', 'true');

    const initRes = await fetch(`${config.uzbekVoiceBaseUrl}/stt`, {
      method: 'POST',
      headers: await getMultipartHeaders(form),
      body: form,
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`STT boshlash xatosi: ${initRes.status} - ${errText}`);
    }

    const initData = await initRes.json();
    const initialTranscript = extractTranscript(initData);

    if (initialTranscript) {
      return initialTranscript;
    }

    const taskId =
      [initData.id, initData.task_id].find(
        (value) => typeof value === 'string' && value.includes('/')
      ) ||
      initData.id ||
      initData.task_id;
    const initialState = initData.status || initData.state;

    if (isFailedState(initialState)) {
      throw new Error('STT aniqlashda xato yuz berdi');
    }

    if (!taskId) {
      throw new Error('STT task ID topilmadi');
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL_MS);
      const pollData = await fetchPollingData(taskId);
      if (!pollData) {
        continue;
      }

      const status = pollData.status || pollData.state;

      if (isCompletedState(status)) {
        const text = extractTranscript(pollData);
        if (!text) throw new Error('STT natijasi bo\'sh');
        return text;
      }

      if (isFailedState(status)) {
        throw new Error('STT aniqlashda xato yuz berdi');
      }

      if (!status && extractTranscript(pollData)) {
        return extractTranscript(pollData);
      }
    }

    throw new Error('STT vaqt tugadi (timeout)');
  },
};
