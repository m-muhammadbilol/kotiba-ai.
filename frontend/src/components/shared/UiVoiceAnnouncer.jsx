import { useEffect, useRef } from 'react';
import { useAudio } from '../../hooks/useAudio.js';
import { useSettingsStore, useUIStore } from '../../store/index.js';

export default function UiVoiceAnnouncer() {
  const { playText } = useAudio();
  const { settings } = useSettingsStore();
  const {
    announcementQueue,
    dequeueAnnouncement,
    clearAnnouncements,
    isPlayingAudio,
  } = useUIStore();

  const activeAnnouncementRef = useRef(null);
  const releaseTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!settings.ttsEnabled) {
      activeAnnouncementRef.current = null;
      clearAnnouncements();
    }
  }, [clearAnnouncements, settings.ttsEnabled]);

  useEffect(() => {
    if (!settings.ttsEnabled) return;
    if (isPlayingAudio) return;

    const nextAnnouncement = announcementQueue[0];
    if (!nextAnnouncement?.message) return;
    if (activeAnnouncementRef.current === nextAnnouncement.id) return;

    activeAnnouncementRef.current = nextAnnouncement.id;
    dequeueAnnouncement();

    (async () => {
      try {
        await playText(nextAnnouncement.message, undefined, { silentFailure: true });
      } finally {
        if (releaseTimerRef.current) {
          clearTimeout(releaseTimerRef.current);
        }

        releaseTimerRef.current = setTimeout(() => {
          if (activeAnnouncementRef.current === nextAnnouncement.id) {
            activeAnnouncementRef.current = null;
          }
        }, 400);
      }
    })();
  }, [announcementQueue, dequeueAnnouncement, isPlayingAudio, playText, settings.ttsEnabled]);

  return null;
}
