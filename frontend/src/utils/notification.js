export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function sendNotification(title, body, options = {}) {
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  try {
    const n = new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options,
    });
    return n;
  } catch {
    return null;
  }
}

export function getNotificationStatus() {
  if (!('Notification' in window)) return 'qo\'llab-quvvatlanmaydi';
  if (Notification.permission === 'granted') return 'ruxsat berilgan';
  if (Notification.permission === 'denied') return 'rad etilgan';
  return 'so\'ralmagan';
}

export async function playNotificationChime() {
  if (typeof window === 'undefined') return false;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    if ('vibrate' in navigator) {
      navigator.vibrate([120, 50, 180]);
    }
    return false;
  }

  try {
    const ctx = new AudioContextCtor();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const notes = [880, 1174.66, 1567.98];

    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = now + index * 0.11;
      const endAt = startAt + 0.18;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startAt);

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startAt);
      osc.stop(endAt);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);

    return true;
  } catch {
    if ('vibrate' in navigator) {
      navigator.vibrate([120, 50, 180]);
    }
    return false;
  }
}
