const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '/api').trim();
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '') || '/api';

function normalizePath(path = '') {
  const value = String(path || '').trim();
  if (!value) return '';
  return `/${value.replace(/^\/+/, '')}`;
}

function buildUrl(path = '') {
  return `${BASE_URL}${normalizePath(path)}`;
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    signal: options.signal,
    credentials: 'include',
  });
  if (!res.ok) {
    let errMsg = `Server xatosi: ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function apiPostFormData(path, formData, options = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    body: formData,
    signal: options.signal,
    credentials: 'include',
  });
  if (!res.ok) {
    let errMsg = `Server xatosi: ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function apiPostAudio(path, body) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    let errMsg = `TTS xatosi: ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.blob();
}
