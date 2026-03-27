import React, { useState, useMemo } from 'react';
import { CheckSquare, Circle, Trash2, Clock, Flag, Search, Plus } from 'lucide-react';
import { useTaskStore, useUIStore } from '../store/index.js';
import { formatDateTime, isOverdue, parseTashkentDateTimeInput } from '../utils/time.js';
import PageHeader from '../components/shared/PageHeader.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';

const PRIORITY_CONFIG = {
  high: { label: 'Yuqori', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  medium: { label: 'O\'rta', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  low: { label: 'Past', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
};

function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueTime, setDueTime] = useState('');

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, dueTime: dueTime ? parseTashkentDateTimeInput(dueTime) : null });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-t-3xl w-full max-w-lg p-6 animate-slide-up safe-bottom">
        <h3 className="font-bold text-[var(--text)] text-lg mb-5">Yangi vazifa</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Vazifa nomi</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nima qilish kerak?"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Muhimlik</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      priority === p ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Muddat (ixtiyoriy)</label>
            <input type="datetime-local" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="input-field" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-ghost">Bekor qilish</button>
            <button onClick={handleAdd} disabled={!title.trim()} className="flex-1 btn-primary disabled:opacity-50">
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = !task.completed && task.dueTime && isOverdue(task.dueTime);

  return (
    <div className={`flex items-start gap-3 p-4 bg-[var(--surface)] rounded-2xl border transition-all duration-200 ${
      task.completed ? 'border-[var(--border)] opacity-60' : `border-[var(--border)] shadow-soft`
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
        }`}
      >
        {task.completed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {task.dueTime && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              <Clock size={10} />
              {formatDateTime(task.dueTime)}
              {overdue && ' · Kechikdi!'}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
      >
        <Trash2 size={15} className="text-surface-400 hover:text-red-500 transition-colors" />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const { showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all' ||
        (filter === 'active' && !t.completed) ||
        (filter === 'done' && t.completed);
      return matchSearch && matchFilter;
    });
  }, [tasks, search, filter]);

  const activeCount = tasks.filter((t) => !t.completed).length;

  function handleAdd(data) {
    addTask(data);
    showToast('✅ Vazifa qo\'shildi', 'success');
  }

  function handleDelete(id) {
    setDeleteId(id);
  }

  function confirmDelete() {
    deleteTask(deleteId);
    setDeleteId(null);
    showToast('Vazifa o\'chirildi', 'info');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <PageHeader
        title="Vazifalar"
        subtitle={activeCount > 0 ? `${activeCount} ta bajarilmagan` : 'Hammasi tayyor!'}
        action={
          <button onClick={() => setShowAddModal(true)} className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm transition-all active:scale-90">
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="page-container space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vazifa qidirish..."
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'active', label: 'Faol' },
            { key: 'done', label: 'Bajarildi' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === key
                  ? 'bg-[var(--surface)] text-primary-500 shadow-soft'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={search ? 'Hech narsa topilmadi' : 'Vazifalar yo\'q'}
            description={search ? 'Boshqa so\'z bilan qidiring' : 'Mikrofon orqali yoki + tugmasi bilan vazifa qo\'shing'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Vazifani o'chirish"
          message="Bu vazifa butunlay o'chiriladi."
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
