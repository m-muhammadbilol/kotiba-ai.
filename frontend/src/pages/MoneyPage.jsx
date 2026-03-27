import React, { useState, useMemo } from 'react';
import { Wallet, Trash2, Plus, TrendingDown, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useMoneyStore, useUIStore } from '../store/index.js';
import { formatMoney, formatDate } from '../utils/time.js';
import PageHeader from '../components/shared/PageHeader.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';

const CATEGORIES = [
  'Ovqat', 'Transport', 'Kiyim', 'Sog\'liq', 'Ta\'lim',
  'Ko\'ngilochar', 'Uy-joy', 'Elektron', 'Boshqa',
];

const PAYMENT_METHODS = [
  { value: 'naqd', label: 'Naqd' },
  { value: 'karta', label: 'Karta' },
  { value: 'apple_pay', label: 'Apple Pay' },
];

const CATEGORY_COLORS = {
  'Ovqat': '#f97316',
  'Transport': '#3b82f6',
  'Kiyim': '#a855f7',
  'Sog\'liq': '#ef4444',
  'Ta\'lim': '#6366f1',
  'Ko\'ngilochar': '#ec4899',
  'Uy-joy': '#14b8a6',
  'Elektron': '#64748b',
  'Boshqa': '#94a3b8',
};

function AddRecordModal({ onClose, onAdd }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ovqat');
  const [currency, setCurrency] = useState('UZS');
  const [paymentMethod, setPaymentMethod] = useState('naqd');
  const [note, setNote] = useState('');

  function handleAdd() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    onAdd({ amount: num, category, currency, paymentMethod, note: note.trim() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-t-3xl w-full max-w-lg p-6 animate-slide-up safe-bottom max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-[var(--text)] text-lg mb-5">Xarajat qo'shish</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Miqdor</label>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div className="w-24">
              <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Valyuta</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Kategoriya</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === cat
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 border-primary-200 dark:border-primary-700'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">To'lov usuli</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentMethod === method.value
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 border-primary-200 dark:border-primary-700'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-ghost">Bekor qilish</button>
            <button onClick={handleAdd} disabled={!amount || parseFloat(amount) <= 0} className="flex-1 btn-primary disabled:opacity-50">
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-[var(--text)]">{label}</p>
      <p className="text-primary-500 font-bold">{payload[0].value.toLocaleString()} so'm</p>
    </div>
  );
};

function getPaymentMethodLabel(method) {
  if (method === 'apple_pay') return 'Apple Pay';
  if (method === 'karta') return 'Karta';
  return 'Naqd';
}

export default function MoneyPage() {
  const { records, addRecord, deleteRecord } = useMoneyStore();
  const { showToast } = useUIStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [period, setPeriod] = useState('week');

  const filteredRecords = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      const d = new Date(r.createdAt);
      if (period === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [records, period]);

  const totalUZS = useMemo(() =>
    filteredRecords.filter((r) => r.currency === 'UZS').reduce((s, r) => s + r.amount, 0),
    [filteredRecords]
  );
  const totalUSD = useMemo(() =>
    filteredRecords.filter((r) => r.currency === 'USD').reduce((s, r) => s + r.amount, 0),
    [filteredRecords]
  );

  // Chart data: group by category
  const chartData = useMemo(() => {
    const groups = {};
    filteredRecords.filter((r) => r.currency === 'UZS').forEach((r) => {
      groups[r.category] = (groups[r.category] || 0) + r.amount;
    });
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  function handleAdd(data) {
    addRecord(data);
    showToast('💸 Xarajat saqlandi', 'success');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <PageHeader
        title="Xarajatlar"
        subtitle="Moliyaviy nazorat"
        action={
          <button onClick={() => setShowAddModal(true)} className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm transition-all active:scale-90">
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="page-container space-y-4">
        {/* Period filter */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {[
            { key: 'today', label: 'Bugun' },
            { key: 'week', label: 'Hafta' },
            { key: 'month', label: 'Oy' },
            { key: 'all', label: 'Barchasi' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === key ? 'bg-[var(--surface)] text-primary-500 shadow-soft' : 'text-[var(--text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-soft">
            <p className="text-xs text-[var(--text-muted)] font-semibold mb-1">Jami (so'm)</p>
            <p className="text-lg font-extrabold text-[var(--text)]">{totalUZS.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-muted)]">so'm</p>
          </div>
          {totalUSD > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-soft">
              <p className="text-xs text-[var(--text-muted)] font-semibold mb-1">Jami (dollar)</p>
              <p className="text-lg font-extrabold text-[var(--text)]">${totalUSD.toFixed(2)}</p>
              <p className="text-xs text-[var(--text-muted)]">USD</p>
            </div>
          )}
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-soft">
            <p className="text-xs text-[var(--text-muted)] font-semibold mb-1">Tranzaksiyalar</p>
            <p className="text-lg font-extrabold text-[var(--text)]">{filteredRecords.length}</p>
            <p className="text-xs text-[var(--text-muted)]">ta</p>
          </div>
          {filteredRecords.length > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-soft">
              <p className="text-xs text-[var(--text-muted)] font-semibold mb-1">O'rtacha</p>
              <p className="text-lg font-extrabold text-[var(--text)]">
                {filteredRecords.length > 0 ? Math.round(totalUZS / filteredRecords.filter(r => r.currency === 'UZS').length || 0).toLocaleString() : 0}
              </p>
              <p className="text-xs text-[var(--text-muted)]">so'm</p>
            </div>
          )}
        </div>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-soft">
            <h3 className="text-sm font-bold text-[var(--text)] mb-4">Kategoriya bo'yicha</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Records list */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Xarajatlar yo'q"
            description="Mikrofon orqali yoki + tugmasi bilan xarajat qo'shing"
          />
        ) : (
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] mb-3">Tranzaksiyalar</h3>
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-soft">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ backgroundColor: (CATEGORY_COLORS[record.category] || '#6366f1') + '20' }}
                  >
                    <span style={{ color: CATEGORY_COLORS[record.category] || '#6366f1' }}>
                      {record.category[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{record.category}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {getPaymentMethodLabel(record.paymentMethod || 'naqd')} · {record.note || formatDate(record.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--text)]">
                      {formatMoney(record.amount, record.currency)}
                    </span>
                    <button
                      onClick={() => setDeleteId(record.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} className="text-surface-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRecordModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Xarajatni o'chirish"
          message="Bu yozuv o'chiriladi."
          danger
          onConfirm={() => { deleteRecord(deleteId); setDeleteId(null); showToast('Xarajat o\'chirildi', 'info'); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
