const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    signal: options.signal,
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
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
    signal: options.signal,
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
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
