const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '/api').trim();
const DEFAULT_FALLBACK_API_URL = 'https://kotiba-ai-akyq.vercel.app/api';

function normalizeBaseUrl(value = '') {
  const cleaned = String(value || '').trim().replace(/\/+$/, '');

  if (!cleaned) return '/api';
  if (cleaned === '/api') return cleaned;

  if (/^https?:\/\//i.test(cleaned)) {
    return /\/api$/i.test(cleaned) ? cleaned : `${cleaned}/api`;
  }

  return cleaned;
}

const BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

function resolveFallbackBaseUrl() {
  const envFallback = normalizeBaseUrl(String(import.meta.env.VITE_API_FALLBACK_URL || '').trim());

  if (envFallback && envFallback !== BASE_URL) {
    return envFallback;
  }

  if (/localhost|127\.0\.0\.1/i.test(BASE_URL)) {
    return DEFAULT_FALLBACK_API_URL;
  }

  return '';
}

const FALLBACK_BASE_URL = resolveFallbackBaseUrl();

function normalizePath(path = '') {
  let value = String(path || '').trim();

  if (!value) return '';

  value = value.replace(/^\/+/, '');

  if (value === 'api') return '';
  if (value.startsWith('api/')) {
    value = value.slice(4);
  }

  return `/${value}`;
}

function buildUrl(path = '', baseUrl = BASE_URL) {
  return `${baseUrl}${normalizePath(path)}`;
}

function isRetryableNetworkError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror');
}

async function fetchWithFallback(path, init = {}, baseUrl = BASE_URL) {
  const requestUrl = buildUrl(path, baseUrl);

  try {
    return await fetch(requestUrl, init);
  } catch (error) {
    const canRetry = FALLBACK_BASE_URL && FALLBACK_BASE_URL !== baseUrl && isRetryableNetworkError(error);

    if (!canRetry) {
      throw error;
    }

    const fallbackUrl = buildUrl(path, FALLBACK_BASE_URL);
    console.warn('[API FALLBACK]', {
      from: requestUrl,
      to: fallbackUrl,
      reason: error?.message || 'network error',
    });

    return fetch(fallbackUrl, init);
  }
}

export async function apiGet(path, options = {}) {
  const res = await fetchWithFallback(path, {
    method: 'GET',
    headers: { ...options.headers },
    signal: options.signal,
  });

  if (!res.ok) {
    let errMsg = `Server xatosi: ${res.status}`;
    let errData = null;
    try {
      errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = errData;
    throw error;
  }

  return res.json();
}

export async function apiPost(path, body, options = {}) {
  const res = await fetchWithFallback(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  if (!res.ok) {
    let errMsg = `Server xatosi: ${res.status}`;
    let errData = null;
    try {
      errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = errData;
    throw error;
  }
  return res.json();
}

export async function apiPostFormData(path, formData, options = {}) {
  const res = await fetchWithFallback(path, {
    method: 'POST',
    body: formData,
    signal: options.signal,
  });
  if (!res.ok) {
    let errMsg = `Server xatosi: ${res.status}`;
    let errData = null;
    try {
      errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = errData;
    throw error;
  }
  return res.json();
}

export async function apiPostAudio(path, body) {
  const res = await fetchWithFallback(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errMsg = `TTS xatosi: ${res.status}`;
    let errData = null;
    try {
      errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = errData;
    throw error;
  }
  return res.blob();
}
