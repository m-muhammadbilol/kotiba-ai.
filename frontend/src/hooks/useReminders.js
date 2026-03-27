import { useEffect, useRef, useCallback } from 'react';
import { useReminderStore, useSettingsStore, useUIStore } from '../store/index.js';
import { sendNotification, playNotificationChime } from '../utils/notification.js';
import { useAudio } from './useAudio.js';

const CHECK_INTERVAL = 10000; // 10 seconds

function toSentenceCase(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildReminderMessage(title) {
  const normalizedTitle = String(title || '').trim().replace(/[.!?]+$/g, '');

  if (!normalizedTitle) {
    return 'Eslatgan ishingizni bajarish vaqti keldi.';
  }

  if (/kerak$/i.test(normalizedTitle) || /vaqti keldi$/i.test(normalizedTitle)) {
    return `${toSentenceCase(normalizedTitle)}.`;
  }

  return `${toSentenceCase(normalizedTitle)} kerak.`;
}

export function useRemindersScheduler() {
  const { reminders, triggeredIds, markTriggered, scheduleNextRepeat } = useReminderStore();
  const { settings } = useSettingsStore();
  const { showToast } = useUIStore();
  const { playText } = useAudio();
  const intervalRef = useRef(null);

  const checkReminders = useCallback(() => {
    const now = new Date();

    reminders.forEach((reminder) => {
      if (!reminder.active) return;
      if (triggeredIds.includes(reminder.id)) return;

      const reminderTime = new Date(reminder.time);
      if (isNaN(reminderTime.getTime())) return;

      const diff = now - reminderTime;

      // Trigger any overdue reminder that hasn't been handled yet.
      // This prevents missed notifications when the tab sleeps/backgrounds.
      if (diff >= 0) {
        markTriggered(reminder.id);
        const shouldSpeakReminder = settings.reminderVoice && settings.ttsEnabled;
        const reminderMessage = buildReminderMessage(reminder.title);

        showToast(`Eslatma: ${reminderMessage}`, 'info');

        if (settings.notificationsEnabled) {
          sendNotification('⏰ Eslatma', reminderMessage, {
            tag: reminder.id,
            renotify: true,
            requireInteraction: true,
            timestamp: reminderTime.getTime(),
          });
        }

        if (settings.reminderSound) {
          playNotificationChime();
        }

        // Speak reminder
        if (shouldSpeakReminder) {
          playText(reminderMessage);
        }

        // Schedule next if repeat
        if (reminder.repeat !== 'none') {
          setTimeout(() => scheduleNextRepeat(reminder.id), 2000);
        }
      }
    });
  }, [reminders, triggeredIds, markTriggered, scheduleNextRepeat, settings, playText, showToast]);

  useEffect(() => {
    checkReminders();
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL);

    const handleWakeUpCheck = () => {
      checkReminders();
    };

    window.addEventListener('focus', handleWakeUpCheck);
    document.addEventListener('visibilitychange', handleWakeUpCheck);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleWakeUpCheck);
      document.removeEventListener('visibilitychange', handleWakeUpCheck);
    };
  }, [checkReminders]);
}
