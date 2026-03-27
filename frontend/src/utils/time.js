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

const NUMBER_WORDS = {
  bir: 1,
  ikki: 2,
  uch: 3,
  tort: 4,
  "to'rt": 4,
  toqqiz: 9,
  "to'qqiz": 9,
  besh: 5,
  olti: 6,
  yetti: 7,
  sakkiz: 8,
  on: 10,
  "o'n": 10,
};

function parseNumberToken(value) {
  const rawValue = String(value || '').trim().toLowerCase();
  if (/^\d+$/.test(rawValue)) {
    return Number(rawValue);
  }

  return NUMBER_WORDS[rawValue] || 0;
}

function normalizeDelayUnit(unit = '') {
  const rawUnit = normalizeNaturalText(unit);
  if (/sek|son/.test(rawUnit)) return 'second';
  if (/min|daq/.test(rawUnit)) return 'minute';
  if (/soat/.test(rawUnit)) return 'hour';
  if (/kun/.test(rawUnit)) return 'day';
  if (/hafta/.test(rawUnit)) return 'week';
  return '';
}

function getDurationLabel(value, unit) {
  const count = Number(value) || 0;

  if (unit === 'second') {
    return `${count} ${count === 1 ? 'sekund' : 'sekund'}dan keyin`;
  }

  if (unit === 'minute') {
    return `${count} ${count === 1 ? 'minut' : 'minut'}dan keyin`;
  }

  if (unit === 'hour') {
    return `${count} ${count === 1 ? 'soat' : 'soat'}dan keyin`;
  }

  if (unit === 'day') {
    return `${count} ${count === 1 ? 'kun' : 'kun'}dan keyin`;
  }

  if (unit === 'week') {
    return `${count} ${count === 1 ? 'hafta' : 'hafta'}dan keyin`;
  }

  return '';
}

function extractRelativeDelay(text = '') {
  const normalized = normalizeNaturalText(text);
  const match = normalized.match(
    /\b(\d+|bir|ikki|uch|tort|to'rt|besh|olti|yetti|sakkiz|toqqiz|to'qqiz|on|o'n)\s*(sekund|soniya|sek|minut|daqiqa|min|soat|kun|hafta)\s*(dan keyin|keyin)\b/
  );

  if (!match) return null;

  const delayValue = parseNumberToken(match[1]);
  const delayUnit = normalizeDelayUnit(match[2]);
  if (!delayValue || !delayUnit) return null;

  return {
    delayValue,
    delayUnit,
    label: getDurationLabel(delayValue, delayUnit),
  };
}

function extractWhenLabel(text = '', isoTime = '') {
  const normalized = normalizeNaturalText(text);
  const relativeDelay = extractRelativeDelay(text);

  if (relativeDelay) {
    return relativeDelay.label;
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
  const count = parseNumberToken(amount);
  if (!Number.isFinite(count) || count <= 0) return 0;

  const normalizedUnit = normalizeDelayUnit(unit);

  if (normalizedUnit === 'second') return count * 1000;
  if (normalizedUnit === 'minute') return count * 60 * 1000;
  if (normalizedUnit === 'hour') return count * 60 * 60 * 1000;
  if (normalizedUnit === 'day') return count * 24 * 60 * 60 * 1000;
  if (normalizedUnit === 'week') return count * 7 * 24 * 60 * 60 * 1000;

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

  const relativeDelay = extractRelativeDelay(sourceText);

  if (relativeDelay) {
    const durationMs = parseDurationToMs(relativeDelay.delayValue, relativeDelay.delayUnit);
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
    .replace(/\b(\d+|bir|ikki|uch|tort|to'rt|besh|olti|yetti|sakkiz|toqqiz|to'qqiz|on|o'n)\s*(sekund|soniya|sek|minut|daqiqa|min|soat|kun|hafta)\s*(dan keyin|keyin)\b/gi, '')
    .replace(/\b(ertaga|bugun)\b/gi, '')
    .replace(/\bsoat\s*\d{1,2}(?::\d{1,2})?\b/gi, '')
    .replace(/\bdeb\b/gi, '')
    .replace(/\b(meni|menga|meni ham|meniyam)\b/gi, '')
    .replace(/\b(eslatib qoy|eslatib qo'y|eslatib qoying|eslatib qo'ying|eslat|eslatsin|eslatgin|eslatib tur)\b/gi, '')
    .replace(/ishimni$/i, 'ish')
    .replace(/ishingizni$/i, 'ish')
    .replace(/ishni$/i, 'ish')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\-:;\s]+|[,.\-:;\s]+$/g, '')
    .trim();
}

export function normalizeReminderData(data = {}, userText = '') {
  const relativeDelay = extractRelativeDelay(data.interval || data.time || userText);
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
    dueTime: normalizedTime || data.dueTime || data.time || '',
    delayValue: data.delayValue || relativeDelay?.delayValue || null,
    delayUnit: data.delayUnit || relativeDelay?.delayUnit || '',
    status: data.status || 'kutilmoqda',
    triggeredAt: data.triggeredAt || null,
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

export function getReminderDueTime(reminder = {}) {
  return reminder.dueTime || reminder.time || '';
}

export function getReminderStatus(reminder = {}) {
  if (reminder.status) return reminder.status;
  if (reminder.triggeredAt || reminder.active === false) return 'bajarildi';
  return 'kutilmoqda';
}

export function formatTimeRemaining(dateStr) {
  const targetDate = toDate(dateStr);
  if (!targetDate) return '';

  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Vaqti keldi';

  const totalSeconds = Math.ceil(diffMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds} soniya qoldi`;

  const totalMinutes = Math.ceil(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} daqiqa qoldi`;

  const totalHours = Math.ceil(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours} soat qoldi`;

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays} kun qoldi`;
}
