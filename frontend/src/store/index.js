import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeGet, safeSet } from '../utils/storage.js';

// ─── Default Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 'medium',
  aiName: 'Kotiba',
  userName: 'Do\'stim',
  userTitle: '',
  ttsEnabled: true,
  autoVoice: true,
  ttsModel: 'lola',
  reminderVoice: true,
  notificationsEnabled: true,
  reminderSound: true,
  responseStyle: 'samimiy',
};

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Messages Store ───────────────────────────────────────────────────────────
export const useMessageStore = create(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (msg) => {
        const message = {
          id: createId('msg'),
          role: msg.role,
          content: msg.content,
          type: msg.type || 'chat',
          data: msg.data || null,
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, message] }));
        return message;
      },
      clearMessages: () => set({ messages: [] }),
      getMessages: () => get().messages,
    }),
    { name: 'kotiba-messages' }
  )
);

// ─── Tasks Store ──────────────────────────────────────────────────────────────
export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) => {
        const newTask = {
          id: createId('task'),
          title: task.title || 'Vazifa',
          dueTime: task.dueTime || null,
          priority: task.priority || 'medium',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        return newTask;
      },
      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },
      clearTasks: () => set({ tasks: [] }),
      getTasks: () => get().tasks,
    }),
    { name: 'kotiba-tasks' }
  )
);

// ─── Reminders Store ──────────────────────────────────────────────────────────
export const useReminderStore = create(
  persist(
    (set, get) => ({
      reminders: [],
      triggeredIds: [],
      addReminder: (reminder) => {
        const newReminder = {
          id: createId('reminder'),
          title: reminder.title || 'Eslatma',
          time: reminder.time || new Date().toISOString(),
          repeat: reminder.repeat || 'none',
          active: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reminders: [newReminder, ...s.reminders] }));
        return newReminder;
      },
      deleteReminder: (id) => {
        set((s) => ({
          reminders: s.reminders.filter((r) => r.id !== id),
          triggeredIds: s.triggeredIds.filter((tid) => tid !== id),
        }));
      },
      toggleReminder: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r
          ),
        }));
      },
      markTriggered: (id) => {
        set((s) => ({
          triggeredIds: [...new Set([...s.triggeredIds, id])],
        }));
      },
      scheduleNextRepeat: (id) => {
        const reminders = get().reminders;
        const reminder = reminders.find((r) => r.id === id);
        if (!reminder) return;

        let nextTime = new Date(reminder.time);
        if (reminder.repeat === 'daily') {
          nextTime.setDate(nextTime.getDate() + 1);
        } else if (reminder.repeat === 'weekly') {
          nextTime.setDate(nextTime.getDate() + 7);
        }

        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, time: nextTime.toISOString() } : r
          ),
          triggeredIds: s.triggeredIds.filter((tid) => tid !== id),
        }));
      },
      clearReminders: () => set({ reminders: [], triggeredIds: [] }),
      getReminders: () => get().reminders,
      getTriggeredIds: () => get().triggeredIds,
    }),
    { name: 'kotiba-reminders' }
  )
);

// ─── Money Store ──────────────────────────────────────────────────────────────
export const useMoneyStore = create(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (record) => {
        const newRecord = {
          id: createId('money'),
          amount: Number(record.amount) || 0,
          category: record.category || 'Boshqa',
          currency: record.currency || 'UZS',
          paymentMethod: record.paymentMethod || 'naqd',
          note: record.note || '',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ records: [newRecord, ...s.records] }));
        return newRecord;
      },
      deleteRecord: (id) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
      },
      clearRecords: () => set({ records: [] }),
      getRecords: () => get().records,
    }),
    { name: 'kotiba-money' }
  )
);

// ─── Settings Store ───────────────────────────────────────────────────────────
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },
      updateSetting: (key, value) => {
        set((s) => ({
          settings: { ...s.settings, [key]: value },
        }));
      },
      updateSettings: (partial) => {
        set((s) => ({
          settings: { ...s.settings, ...partial },
        }));
      },
      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
      getSettings: () => get().settings,
    }),
    { name: 'kotiba-settings' }
  )
);

// ─── UI Store (non-persistent) ────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  isRecording: false,
  isProcessingSTT: false,
  isProcessingAI: false,
  isPlayingAudio: false,
  toast: null,
  toastTimer: null,
  setRecording: (v) => set({ isRecording: v }),
  setProcessingSTT: (v) => set({ isProcessingSTT: v }),
  setProcessingAI: (v) => set({ isProcessingAI: v }),
  setPlayingAudio: (v) => set({ isPlayingAudio: v }),
  showToast: (message, type = 'info') => {
    set((state) => {
      if (state.toastTimer) {
        clearTimeout(state.toastTimer);
      }

      const toastTimer = setTimeout(() => {
        set({ toast: null, toastTimer: null });
      }, 3500);

      return {
        toast: { message, type, id: Date.now() },
        toastTimer,
      };
    });
  },
  hideToast: () =>
    set((state) => {
      if (state.toastTimer) {
        clearTimeout(state.toastTimer);
      }

      return { toast: null, toastTimer: null };
    }),
}));
