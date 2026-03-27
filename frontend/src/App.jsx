import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './store/index.js';
import { applyTheme, applyFontSize } from './utils/theme.js';
import { useRemindersScheduler } from './hooks/useReminders.js';
import Layout from './components/shared/Layout.jsx';
import ChatPage from './pages/ChatPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import RemindersPage from './pages/RemindersPage.jsx';
import MoneyPage from './pages/MoneyPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Toast from './components/shared/Toast.jsx';
import UiVoiceAnnouncer from './components/shared/UiVoiceAnnouncer.jsx';
import { useUIStore } from './store/index.js';

function ReminderScheduler() {
  useRemindersScheduler();
  return null;
}

function ThemeManager() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    applyFontSize(settings.fontSize);
  }, [settings.fontSize]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  return null;
}

export default function App() {
  const { toast } = useUIStore();

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ThemeManager />
      <ReminderScheduler />
      <UiVoiceAnnouncer />
      {toast && <Toast message={toast.message} type={toast.type} key={toast.id} />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="money" element={<MoneyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
