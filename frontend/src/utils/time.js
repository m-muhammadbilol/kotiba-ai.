export const UZBEK_LOCALE = 'uz-UZ';
export const TASHKENT_TIMEZONE = 'Asia/Tashkent';
export const TASHKENT_OFFSET = '+05:00';

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatInTashkent(value, options, fallback = '') {
  const date = toDate(value);
  if (!date) return fallback || String(value || '');

  return new Intl.DateTimeFormat(UZBEK_LOCALE, {
    timeZone: TASHKENT_TIMEZONE,
    hourCycle: 'h23',
    ...options,
  }).format(date);
}

function getTashkentDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TASHKENT_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

export function getCurrentTashkentDate(date = new Date()) {
  const parts = getTashkentDateParts(date);
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${TASHKENT_OFFSET}`
  );
}

export function parseTashkentDateTimeInput(value) {
  if (!value) return '';
  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}${TASHKENT_OFFSET}`).toISOString();
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatInTashkent(dateStr, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }, dateStr);
  } catch {
    return dateStr;
  }
}

export function getCurrentTimeLabel(date = new Date()) {
  const parts = getTashkentDateParts(date);
  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

export function getCurrentTimeAnnouncement(date = new Date()) {
  return `Hozir Toshkent vaqti bilan soat ${getCurrentTimeLabel(date)}.`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return formatInTashkent(dateStr, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }, dateStr);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatInTashkent(dateStr, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }, dateStr);
  } catch {
    return dateStr;
  }
}

export function formatChatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozir';
    if (mins < 60) return `${mins} daqiqa oldin`;
    if (mins < 1440) return `${Math.floor(mins / 60)} soat oldin`;
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

export function formatMoney(amount, currency = 'UZS') {
  try {
    const num = Number(amount);
    if (isNaN(num)) return `0 ${currency}`;
    if (currency === 'USD') {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `${num.toLocaleString('uz-UZ')} so'm`;
  } catch {
    return `${amount} ${currency}`;
  }
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

export function parseRelativeTime(text) {
  // Try to parse natural language time expressions
  const now = getCurrentTashkentDate();
  const t = text.toLowerCase();

  if (t.includes('ertaga')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (t.includes('bugun')) {
    const d = new Date(now);
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString();
  }
  try {
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch {}
  return text;
}
