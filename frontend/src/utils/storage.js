export function safeGet(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearAll() {
  try {
    const keysToRemove = [
      'kotiba-messages',
      'kotiba-tasks',
      'kotiba-reminders',
      'kotiba-money',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
