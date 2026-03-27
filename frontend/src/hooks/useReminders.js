import { useEffect, useRef, useCallback } from 'react';
import { useReminderStore, useSettingsStore, useUIStore } from '../store/index.js';
import { sendNotification, playNotificationChime } from '../utils/notification.js';
import { useAudio } from './useAudio.js';

const CHECK_INTERVAL = 30000; // 30 seconds

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
      // Trigger if within 30 seconds past due
      if (diff >= 0 && diff <= CHECK_INTERVAL + 5000) {
        markTriggered(reminder.id);
        showToast(`Eslatma vaqti keldi: ${reminder.title}`, 'info');

        // Send notification
        if (settings.notificationsEnabled) {
          sendNotification('⏰ ' + reminder.title, 'Eslatma vaqti keldi!', {
            tag: reminder.id,
          });
        }

        if (settings.reminderSound) {
          playNotificationChime();
        }

        // Speak reminder
        if (settings.reminderVoice && settings.ttsEnabled) {
          playText(`Eslatma: ${reminder.title}`);
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
    return () => clearInterval(intervalRef.current);
  }, [checkReminders]);
}
