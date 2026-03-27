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

function normalizeNaturalText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʻʼ'`’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function hasReminderIntent(text = '') {
  return /\beslat(ib|aman|asan|adi|sin|gin|ing|ay)?\b/i.test(String(text || ''));
}

function extractWhenLabel(text = '', isoTime = '') {
  const normalized = normalizeNaturalText(text);
  const relativeMatch = normalized.match(
    /(\d+)\s*(sekund|soniya|sek|minut|daqiqa|min|soat|kun|hafta)\s*(dan keyin|keyin)/
  );

  if (relativeMatch) {
    return `${relativeMatch[1]} ${relativeMatch[2]}dan keyin`;
  }

  if (normalized.includes('ertaga')) {
    const clockMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
    return clockMatch ? `ertaga soat ${clockMatch[1]}:${String(clockMatch[2] || 0).padStart(2, '0')} da` : 'ertaga';
  }

  if (normalized.includes('bugun')) {
    const clockMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
    return clockMatch ? `bugun soat ${clockMatch[1]}:${String(clockMatch[2] || 0).padStart(2, '0')} da` : 'bugun';
  }

  const clockMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
  if (clockMatch) {
    return `soat ${clockMatch[1]}:${String(clockMatch[2] || 0).padStart(2, '0')} da`;
  }

  return isoTime ? formatDateTime(isoTime) : '';
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

function parseDurationToMs(amount, unit) {
  const count = Number(amount);
  if (!Number.isFinite(count) || count <= 0) return 0;

  if (/sek|son/i.test(unit)) return count * 1000;
  if (/min|daq/i.test(unit)) return count * 60 * 1000;
  if (/soat/i.test(unit)) return count * 60 * 60 * 1000;
  if (/kun/i.test(unit)) return count * 24 * 60 * 60 * 1000;
  if (/hafta/i.test(unit)) return count * 7 * 24 * 60 * 60 * 1000;

  return 0;
}

function tryParseDate(value) {
  if (!value) return '';

  try {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {}

  return '';
}

export function parseRelativeTime(text, baseDate = getCurrentTashkentDate()) {
  const sourceText = String(text || '').trim();
  if (!sourceText) return '';

  const absoluteDate = tryParseDate(sourceText);
  if (absoluteDate) return absoluteDate;

  const normalized = normalizeNaturalText(sourceText);
  const now = new Date(baseDate);

  const durationMatch = normalized.match(
    /(\d+)\s*(sekund|soniya|sek|minut|daqiqa|min|soat|kun|hafta)(?:dan|dan keyin| keyin)?/
  );

  if (durationMatch && /keyin/.test(normalized)) {
    const durationMs = parseDurationToMs(durationMatch[1], durationMatch[2]);
    if (durationMs > 0) {
      return new Date(now.getTime() + durationMs).toISOString();
    }
  }

  if (normalized.includes('ertaga')) {
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);

    const timeMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      nextDay.setHours(Number(timeMatch[1]), Number(timeMatch[2] || 0), 0, 0);
    } else {
      nextDay.setHours(9, 0, 0, 0);
    }

    return nextDay.toISOString();
  }

  if (normalized.includes('bugun')) {
    const sameDay = new Date(now);
    const timeMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      sameDay.setHours(Number(timeMatch[1]), Number(timeMatch[2] || 0), 0, 0);
    } else {
      sameDay.setHours(sameDay.getHours() + 1, 0, 0, 0);
    }
    return sameDay.toISOString();
  }

  const clockMatch = normalized.match(/soat\s*(\d{1,2})(?::(\d{1,2}))?/);
  if (clockMatch) {
    const target = new Date(now);
    target.setHours(Number(clockMatch[1]), Number(clockMatch[2] || 0), 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return target.toISOString();
  }

  return '';
}

export function extractReminderTitle(text) {
  const sourceText = String(text || '').trim();
  if (!sourceText) return '';

  return sourceText
    .replace(/\b\d+\s*(sekund|soniya|sek|minut|daqiqa|min|soat|kun|hafta)\s*(dan keyin|keyin)\b/gi, '')
    .replace(/\b(ertaga|bugun)\b/gi, '')
    .replace(/\bsoat\s*\d{1,2}(?::\d{1,2})?\b/gi, '')
    .replace(/\b(eslatib qoy|eslatib qo'y|eslatib qoying|eslatib qo'ying|eslat|eslatsin|eslatgin|eslatib tur)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\-:;\s]+|[,.\-:;\s]+$/g, '')
    .trim();
}

export function normalizeReminderData(data = {}, userText = '') {
  const normalizedTime =
    tryParseDate(data.time) ||
    parseRelativeTime(data.interval) ||
    parseRelativeTime(data.time) ||
    parseRelativeTime(userText);

  const normalizedTitle =
    String(data.title || '').trim() ||
    extractReminderTitle(userText) ||
    'Eslatma';

  return {
    ...data,
    title: normalizedTitle,
    time: normalizedTime || data.time || '',
    repeat: data.repeat || 'none',
  };
}

export function resolveQuickReminder(userText = '') {
  const sourceText = String(userText || '').trim();
  if (!sourceText || !hasReminderIntent(sourceText)) return null;

  const normalizedReminder = normalizeReminderData({}, sourceText);
  if (!normalizedReminder.time) return null;

  const whenLabel = extractWhenLabel(sourceText, normalizedReminder.time);
  const reminderTitle = normalizedReminder.title || 'eslatma';
  const response = whenLabel
    ? `Xo'p, ${whenLabel} ${reminderTitle} eslataman.`
    : `Xo'p, ${reminderTitle} eslataman.`;

  return {
    ...normalizedReminder,
    response,
  };
}
