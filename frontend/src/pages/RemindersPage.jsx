import React, { useState, useMemo } from 'react';
import { Bell, BellOff, Trash2, Clock, Repeat, Plus, Calendar } from 'lucide-react';
import { useReminderStore, useUIStore } from '../store/index.js';
import { formatDateTime, isOverdue, parseTashkentDateTimeInput } from '../utils/time.js';
import PageHeader from '../components/shared/PageHeader.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';

const REPEAT_LABELS = {
  none: 'Bir martalik',
  daily: 'Har kuni',
  weekly: 'Har hafta',
};

function AddReminderModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState('none');

  function handleAdd() {
    if (!title.trim() || !time) return;
    onAdd({ title: title.trim(), time: parseTashkentDateTimeInput(time), repeat });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-t-3xl w-full max-w-lg p-6 animate-slide-up safe-bottom">
        <h3 className="font-bold text-[var(--text)] text-lg mb-5">Yangi eslatma</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Eslatma matni</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nimani eslatish kerak?"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Vaqt</label>
            <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Takrorlash</label>
            <div className="flex gap-2">
              {['none', 'daily', 'weekly'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRepeat(r)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    repeat === r
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 border-primary-200 dark:border-primary-700'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {REPEAT_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-ghost">Bekor qilish</button>
            <button onClick={handleAdd} disabled={!title.trim() || !time} className="flex-1 btn-primary disabled:opacity-50">
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderItem({ reminder, onToggle, onDelete }) {
  const overdue = reminder.active && isOverdue(reminder.time);
  const isRepeating = reminder.repeat !== 'none';

  return (
    <div className={`p-4 bg-[var(--surface)] rounded-2xl border shadow-soft transition-all ${
      !reminder.active ? 'opacity-50 border-[var(--border)]' : overdue ? 'border-red-200 dark:border-red-800' : 'border-[var(--border)]'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl flex-shrink-0 ${
          overdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-violet-50 dark:bg-violet-900/20'
        }`}>
          <Bell size={16} className={overdue ? 'text-red-500' : 'text-violet-500'} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">{reminder.title}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              <Clock size={11} />
              {formatDateTime(reminder.time)}
              {overdue && ' · O\'tib ketdi'}
            </span>
            {isRepeating && (
              <span className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                <Repeat size={11} />
                {REPEAT_LABELS[reminder.repeat]}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggle(reminder.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            {reminder.active
              ? <Bell size={14} className="text-violet-500" />
              : <BellOff size={14} className="text-surface-400" />
            }
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} className="text-surface-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const { reminders, addReminder, deleteReminder, toggleReminder } = useReminderStore();
  const { showToast } = useUIStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const now = new Date();
    return reminders.filter((r) => {
      if (filter === 'active') return r.active && new Date(r.time) >= now;
      if (filter === 'past') return !r.active || new Date(r.time) < now;
      return true;
    });
  }, [reminders, filter]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return reminders.filter((r) => r.active && new Date(r.time) >= now).length;
  }, [reminders]);

  function handleAdd(data) {
    addReminder(data);
    showToast('🔔 Eslatma qo\'shildi', 'success');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <PageHeader
        title="Eslatmalar"
        subtitle={upcomingCount > 0 ? `${upcomingCount} ta kelayotgan` : 'Faol eslatma yo\'q'}
        action={
          <button onClick={() => setShowAddModal(true)} className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm transition-all active:scale-90">
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="page-container space-y-3">
        {/* Filter */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {[{ key: 'all', label: 'Barchasi' }, { key: 'active', label: 'Kelayotgan' }, { key: 'past', label: 'O\'tgan' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === key ? 'bg-[var(--surface)] text-primary-500 shadow-soft' : 'text-[var(--text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Eslatmalar yo'q"
            description="Mikrofon orqali yoki + tugmasi bilan eslatma qo'shing"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <ReminderItem
                key={r.id}
                reminder={r}
                onToggle={toggleReminder}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddReminderModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Eslatmani o'chirish"
          message="Bu eslatma butunlay o'chiriladi."
          danger
          onConfirm={() => { deleteReminder(deleteId); setDeleteId(null); showToast('Eslatma o\'chirildi', 'info'); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
