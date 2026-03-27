import React, { useState } from 'react';
import {
  Sun, Moon, Monitor, Type, User, Volume2, VolumeX, Bell, BellOff,
  MessageSquare, Database, Shield, ChevronRight, Check, RefreshCw,
  Trash2, Download, TestTube, Info
} from 'lucide-react';
import { useSettingsStore, useMessageStore, useTaskStore, useReminderStore, useMoneyStore, useUIStore } from '../store/index.js';
import { applyTheme, applyFontSize } from '../utils/theme.js';
import { requestNotificationPermission, sendNotification, getNotificationStatus, playNotificationChime } from '../utils/notification.js';
import { useAudio } from '../hooks/useAudio.js';
import { clearAll } from '../utils/storage.js';
import PageHeader from '../components/shared/PageHeader.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-2">{title}</p>
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-soft overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, description, children, onClick, iconColor = 'text-primary-500' }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-0 ${onClick ? 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 active:bg-surface-100 dark:active:bg-surface-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-100 dark:bg-surface-700 ${iconColor}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${value ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === opt.value
              ? 'bg-[var(--surface)] text-primary-500 shadow-soft'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {opt.icon && <opt.icon size={13} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSetting, updateSettings, resetSettings } = useSettingsStore();
  const { clearMessages } = useMessageStore();
  const { clearTasks } = useTaskStore();
  const { clearReminders } = useReminderStore();
  const { clearRecords } = useMoneyStore();
  const { showToast } = useUIStore();
  const { playText } = useAudio();

  const [confirm, setConfirm] = useState(null);
  const [notifStatus, setNotifStatus] = useState(getNotificationStatus());

  // Theme change → apply immediately
  function handleThemeChange(val) {
    updateSetting('theme', val);
    applyTheme(val);
    const message = val === 'dark'
      ? 'Qorong‘u rejim yoqildi'
      : val === 'light'
        ? 'Yorug‘ rejim yoqildi'
        : 'Tizim mavzusi tanlandi';
    showToast(message, 'success');
  }

  // Font size change → apply immediately
  function handleFontSizeChange(val) {
    updateSetting('fontSize', val);
    applyFontSize(val);
    const message = val === 'kichik'
      ? 'Kichik shrift tanlandi'
      : val === 'katta'
        ? 'Katta shrift tanlandi'
        : 'O‘rta shrift tanlandi';
    showToast(message, 'success');
  }

  function handleResponseStyleChange(val) {
    updateSetting('responseStyle', val);
    showToast(`Javob uslubi ${val} ga o‘zgardi`, 'success');
  }

  function handleSettingToggle(key, value) {
    updateSetting(key, value);

    const messages = {
      ttsEnabled: value ? 'Ovozli javob yoqildi' : 'Ovozli javob o‘chirildi',
      autoVoice: value ? 'Avtomatik ovoz yoqildi' : 'Avtomatik ovoz o‘chirildi',
      reminderVoice: value ? 'Eslatma ovozi yoqildi' : 'Eslatma ovozi o‘chirildi',
      reminderSound: value ? 'Eslatma signali yoqildi' : 'Eslatma signali o‘chirildi',
      notificationsEnabled: value ? 'Bildirishnomalar yoqildi' : 'Bildirishnomalar o‘chirildi',
    };

    showToast(messages[key] || 'Sozlama yangilandi', 'success');
  }

  function handleTtsModelChange(value) {
    updateSetting('ttsModel', value);
    showToast(`Ovoz modeli ${value} ga o‘zgardi`, 'success');
  }

  function handleProfileFieldBlur(key, value) {
    const normalized = value.trim();
    if (!normalized) return;

    const messages = {
      aiName: `Kotiba ismi ${normalized} bo‘ldi`,
      userTitle: `Murojaat shakli ${normalized} bo‘ldi`,
      userName: `Sizni ${normalized} deb chaqiraman`,
    };

    showToast(messages[key] || 'Sozlama yangilandi', 'success');
  }

  async function handleRequestNotification() {
    const result = await requestNotificationPermission();
    setNotifStatus(getNotificationStatus());
    if (result === 'granted') {
      updateSetting('notificationsEnabled', true);
      showToast('Bildirishnomalar yoqildi!', 'success');
    } else if (result === 'denied') {
      showToast('Bildirishnoma rad etildi. Brauzer sozlamalarini tekshiring.', 'error');
    }
  }

  async function handleTestNotification() {
    const status = await requestNotificationPermission();
    if (status !== 'granted') {
      showToast('Avval ruxsat bering', 'warning');
      return;
    }
    sendNotification('🔔 Test bildirishnoma', 'KOTIBA AI bildirishnomalari ishlayapti!');
    showToast('Test bildirishnoma yuborildi', 'success');
  }

  async function handleTestVoice() {
    if (!settings.ttsEnabled) {
      showToast('Avval TTS ni yoqing', 'warning');
      return;
    }

    await playText(`Assalomu alaykum. Men ${settings.aiName || 'Kotiba'}man. Ovoz sinovi muvaffaqiyatli ishladi.`);
    showToast('TTS sinovi boshlandi', 'success', { speak: false });
  }

  async function handleTestReminderSound() {
    await playNotificationChime();
    showToast('Eslatma signali ijro etildi', 'success');
  }

  function handleExportData() {
    const data = {
      exportDate: new Date().toISOString(),
      messages: JSON.parse(localStorage.getItem('kotiba-messages') || '{"state":{"messages":[]}}')?.state?.messages || [],
      tasks: JSON.parse(localStorage.getItem('kotiba-tasks') || '{"state":{"tasks":[]}}')?.state?.tasks || [],
      reminders: JSON.parse(localStorage.getItem('kotiba-reminders') || '{"state":{"reminders":[]}}')?.state?.reminders || [],
      money: JSON.parse(localStorage.getItem('kotiba-money') || '{"state":{"records":[]}}')?.state?.records || [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotiba-ai-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Ma\'lumotlar yuklab olindi', 'success');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <PageHeader title="Sozlamalar" subtitle="Ilovani shaxsiylashtirishingiz" />

      <div className="page-container space-y-4">

        {/* Appearance */}
        <Section title="Tashqi ko'rinish">
          <Row icon={Monitor} label="Mavzu" description="Ilovaning rang sxemasini tanlang">
            <SegmentedControl
              value={settings.theme}
              onChange={handleThemeChange}
              options={[
                { value: 'light', label: 'Yorug\'', icon: Sun },
                { value: 'system', label: 'Tizim', icon: Monitor },
                { value: 'dark', label: 'Qorong\'i', icon: Moon },
              ]}
            />
          </Row>
          <Row icon={Type} label="Shrift o'lchami" description="Matn o'lchamini sozlash">
            <SegmentedControl
              value={settings.fontSize}
              onChange={handleFontSizeChange}
              options={[
                { value: 'kichik', label: 'Kichik' },
                { value: 'medium', label: 'O\'rta' },
                { value: 'katta', label: 'Katta' },
              ]}
            />
          </Row>
        </Section>

        {/* Kotiba persona */}
        <Section title="Kotiba shaxsi">
          <Row icon={User} label="Kotiba ismi" description={`Hozir: "${settings.aiName}"`}>
            <input
              type="text"
              value={settings.aiName}
              onChange={(e) => updateSetting('aiName', e.target.value)}
              onBlur={(e) => handleProfileFieldBlur('aiName', e.target.value)}
              placeholder="Kotiba"
              className="w-28 text-sm text-right bg-transparent text-primary-500 font-semibold outline-none"
            />
          </Row>
          <Row icon={User} label="Unvon" description="Siz qanday chaqirilasiz?">
            <input
              type="text"
              value={settings.userTitle}
              onChange={(e) => updateSetting('userTitle', e.target.value)}
              onBlur={(e) => handleProfileFieldBlur('userTitle', e.target.value)}
              placeholder="Janob/Xonim"
              className="w-28 text-sm text-right bg-transparent text-[var(--text-muted)] font-medium outline-none"
            />
          </Row>
          <Row icon={User} label="Ismingiz" description={`Kotiba sizi "${settings.userTitle ? settings.userTitle + ' ' : ''}${settings.userName}" deb chaqiradi`}>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => updateSetting('userName', e.target.value)}
              onBlur={(e) => handleProfileFieldBlur('userName', e.target.value)}
              placeholder="Ismingiz"
              className="w-28 text-sm text-right bg-transparent text-[var(--text-muted)] font-medium outline-none"
            />
          </Row>
        </Section>

        {/* AI response style */}
        <Section title="AI javob uslubi">
          <Row icon={MessageSquare} label="Javob uslubi" description="Kotibaning gapirish tarzi">
            <div className="grid grid-cols-2 gap-1.5 w-44">
              {[
                { value: 'qisqa', label: 'Qisqa' },
                { value: 'samimiy', label: 'Samimiy' },
                { value: 'batafsil', label: 'Batafsil' },
                { value: 'rasmiy', label: 'Rasmiy' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleResponseStyleChange(opt.value)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    settings.responseStyle === opt.value
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 border-primary-200 dark:border-primary-700'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Voice settings */}
        <Section title="Ovoz sozlamalari">
          <Row icon={settings.ttsEnabled ? Volume2 : VolumeX} label="Ovozli javob (TTS)" description="Kotiba ovozda gapirsin">
            <Toggle value={settings.ttsEnabled} onChange={(v) => handleSettingToggle('ttsEnabled', v)} />
          </Row>
          <Row icon={Volume2} label="Avtomatik ovoz" description="Har javobda o'zi gapirsin">
            <Toggle value={settings.autoVoice} onChange={(v) => handleSettingToggle('autoVoice', v)} />
          </Row>
          <Row icon={Volume2} label="Ovoz modeli" description="TTS ovoz turi">
            <select
              value={settings.ttsModel}
              onChange={(e) => handleTtsModelChange(e.target.value)}
              className="text-sm bg-surface-100 dark:bg-surface-700 text-[var(--text)] rounded-xl px-3 py-1.5 border-none outline-none font-medium"
            >
              <option value="lola">Lola</option>
              <option value="sarvar">Sarvar</option>
            </select>
          </Row>
          <Row icon={Bell} label="Eslatmada ovoz" description="Eslatma vaqtida ovozda aytsin">
            <Toggle value={settings.reminderVoice} onChange={(v) => handleSettingToggle('reminderVoice', v)} />
          </Row>
          <Row icon={Bell} label="Eslatma signali" description="Bildirishnomada qisqa signal chalinsin">
            <Toggle value={settings.reminderSound} onChange={(v) => handleSettingToggle('reminderSound', v)} />
          </Row>
          <Row
            icon={TestTube}
            label="TTS ni sinash"
            description="Kotiba ovozini tekshirish"
            onClick={handleTestVoice}
            iconColor="text-emerald-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={TestTube}
            label="Eslatma signalini sinash"
            description="Notification chime ni tekshirish"
            onClick={handleTestReminderSound}
            iconColor="text-amber-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Bildirishnomalar">
          <Row
            icon={settings.notificationsEnabled ? Bell : BellOff}
            label="Brauzer bildirishnomalari"
            description={`Holat: ${notifStatus}`}
          >
            <Toggle
              value={settings.notificationsEnabled}
              onChange={(v) => {
                if (v) handleRequestNotification();
                else handleSettingToggle('notificationsEnabled', false);
              }}
            />
          </Row>
          <Row
            icon={Bell}
            label="Ruxsat so'rash"
            description="Brauzerdan ruxsat olish"
            onClick={handleRequestNotification}
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={TestTube}
            label="Test bildirishnoma"
            description="Ishlashini tekshirish"
            onClick={handleTestNotification}
            iconColor="text-emerald-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
        </Section>

        {/* Data management */}
        <Section title="Ma'lumot boshqaruvi">
          <Row
            icon={Download}
            label="Ma'lumotlarni yuklab olish"
            description="JSON formatda export"
            onClick={handleExportData}
            iconColor="text-blue-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={Trash2}
            label="Xabarlarni o'chirish"
            description="Chat tarixi o'chiriladi"
            onClick={() => setConfirm({ type: 'messages', title: 'Xabarlarni o\'chirish', message: 'Barcha chat xabarlari o\'chiriladi.' })}
            iconColor="text-amber-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={Trash2}
            label="Vazifalarni o'chirish"
            description="Barcha vazifalar o'chiriladi"
            onClick={() => setConfirm({ type: 'tasks', title: 'Vazifalarni o\'chirish', message: 'Barcha vazifalar o\'chiriladi.' })}
            iconColor="text-amber-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={Trash2}
            label="Eslatmalarni o'chirish"
            description="Barcha eslatmalar o'chiriladi"
            onClick={() => setConfirm({ type: 'reminders', title: 'Eslatmalarni o\'chirish', message: 'Barcha eslatmalar o\'chiriladi.' })}
            iconColor="text-amber-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={Trash2}
            label="Xarajatlarni o'chirish"
            description="Barcha xarajat tarixi o'chiriladi"
            onClick={() => setConfirm({ type: 'money', title: 'Xarajatlarni o\'chirish', message: 'Barcha xarajat yozuvlari o\'chiriladi.' })}
            iconColor="text-amber-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
          <Row
            icon={Trash2}
            label="HAMMASINI o'chirish"
            description="Barcha ma'lumotlar tozalanadi"
            onClick={() => setConfirm({ type: 'all', title: 'Barcha ma\'lumotlarni o\'chirish', message: 'Chat, vazifalar, eslatmalar va xarajatlar — hammasi o\'chiriladi. Bu amaldan qaytib bo\'lmaydi!' })}
            iconColor="text-red-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
        </Section>

        {/* Reset */}
        <Section title="Xavfsizlik">
          <Row
            icon={RefreshCw}
            label="Sozlamalarni tiklash"
            description="Barcha sozlamalar asl holatiga qaytadi"
            onClick={() => setConfirm({ type: 'settings', title: 'Sozlamalarni tiklash', message: 'Barcha sozlamalar default holatiga qaytadi.' })}
            iconColor="text-surface-500"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Row>
        </Section>

        {/* App info */}
        <div className="text-center py-4 pb-2">
          <p className="text-xs text-[var(--text-muted)] font-medium">KOTIBA AI v1.0.0</p>
          <p className="text-xs text-[var(--text-muted)]">O'zbek tilidagi aqlli kotiba</p>
        </div>
      </div>

      {/* Confirm dialogs */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger
          onConfirm={() => {
            switch (confirm.type) {
              case 'messages': clearMessages(); showToast('Xabarlar o\'chirildi', 'info'); break;
              case 'tasks': clearTasks(); showToast('Vazifalar o\'chirildi', 'info'); break;
              case 'reminders': clearReminders(); showToast('Eslatmalar o\'chirildi', 'info'); break;
              case 'money': clearRecords(); showToast('Xarajatlar o\'chirildi', 'info'); break;
              case 'all': clearMessages(); clearTasks(); clearReminders(); clearRecords(); showToast('Barcha ma\'lumotlar tozalandi', 'info'); break;
              case 'settings': resetSettings(); applyTheme('system'); applyFontSize('medium'); showToast('Sozlamalar tiklandi', 'success'); break;
            }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
