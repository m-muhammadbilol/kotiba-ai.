import React, { useEffect, useRef, useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  useMessageStore,
  useTaskStore,
  useReminderStore,
  useMoneyStore,
  useSettingsStore,
  useUIStore,
} from '../store/index.js';
import { useVoice } from '../hooks/useVoice.js';
import { useAudio } from '../hooks/useAudio.js';
import { apiPost } from '../utils/api.js';
import ChatInput from '../components/chat/ChatInput.jsx';
import ChatHeader from '../components/chat/ChatHeader.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx';
import { applyTheme, applyFontSize } from '../utils/theme.js';
import { resolveVoiceCommand } from '../utils/voiceCommands.js';
import { getCurrentTimeAnnouncement } from '../utils/time.js';

function buildCommandMessage(command) {
  if (command.type === 'time') {
    return getCurrentTimeAnnouncement();
  }

  return command.response || 'Amal bajarildi.';
}

export default function ChatPage() {
  const { messages, addMessage, clearMessages } = useMessageStore();
  const { addTask, clearTasks } = useTaskStore();
  const { addReminder, clearReminders } = useReminderStore();
  const { addRecord, clearRecords } = useMoneyStore();
  const { settings, updateSetting, updateSettings } = useSettingsStore();
  const {
    isRecording,
    isProcessingSTT,
    isProcessingAI,
    isPlayingAudio,
    setProcessingAI,
    showToast,
  } = useUIStore();
  const { startRecording, stopRecording, cancelRecording, unlockAudioContext } = useVoice();
  const { playText, stopAudio } = useAudio();
  const navigate = useNavigate();

  const bottomRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({
        behavior: messages.length > 1 ? 'smooth' : 'auto',
        block: 'end',
      });
    };

    window.requestAnimationFrame(scrollToBottom);
  }, [messages, isProcessingAI]);

  const applyIncomingSettings = useCallback(
    (data = {}) => {
      if (data.theme) {
        updateSetting('theme', data.theme);
        applyTheme(data.theme);
      }

      if (data.fontSize) {
        updateSetting('fontSize', data.fontSize);
        applyFontSize(data.fontSize);
      }

      if (data.responseStyle) {
        updateSetting('responseStyle', data.responseStyle);
      }

      const nextUserName = data.user_name || data.userName;
      if (nextUserName) {
        updateSetting('userName', nextUserName);
      }
    },
    [updateSetting]
  );

  const handleLocalCommand = useCallback(
    async (userText) => {
      const command = resolveVoiceCommand(userText);
      if (!command) return false;

      let nextRoute = null;
      let responseType = 'chat';
      let responseData = { source: 'voice-command', action: command.type };

      switch (command.type) {
        case 'theme':
          updateSetting('theme', command.value);
          applyTheme(command.value);
          responseType = 'settings';
          responseData = { ...responseData, theme: command.value };
          break;
        case 'fontSize':
          updateSetting('fontSize', command.value);
          applyFontSize(command.value);
          responseType = 'settings';
          responseData = { ...responseData, fontSize: command.value };
          break;
        case 'responseStyle':
          updateSetting('responseStyle', command.value);
          responseType = 'settings';
          responseData = { ...responseData, responseStyle: command.value };
          break;
        case 'voice':
          updateSettings(command.value);
          responseType = 'settings';
          responseData = { ...responseData, ...command.value };
          break;
        case 'clear':
          if (command.value === 'messages') {
            clearMessages();
            setInputValue('');
          } else if (command.value === 'tasks') {
            clearTasks();
          } else if (command.value === 'reminders') {
            clearReminders();
          } else if (command.value === 'money') {
            clearRecords();
          } else if (command.value === 'all') {
            clearMessages();
            clearTasks();
            clearReminders();
            clearRecords();
            setInputValue('');
          }
          break;
        case 'navigate':
          nextRoute = command.value;
          break;
        case 'time':
        default:
          break;
      }

      const responseText = buildCommandMessage(command);

      addMessage({
        role: 'assistant',
        content: responseText,
        type: responseType,
        data: responseData,
      });

      const shouldSpeakReply = !command.skipVoiceReply && settings.ttsEnabled && settings.autoVoice;
      showToast(responseText, command.toastType || 'success', { speak: !shouldSpeakReply });

      if (shouldSpeakReply) {
        await playText(responseText);
      }

      if (nextRoute) {
        navigate(nextRoute);
      }

      return true;
    },
    [
      addMessage,
      clearMessages,
      clearTasks,
      clearReminders,
      clearRecords,
      navigate,
      playText,
      settings.autoVoice,
      settings.ttsEnabled,
      showToast,
      updateSetting,
      updateSettings,
    ]
  );

  const handleAIResponse = useCallback(
    async (userText) => {
      setProcessingAI(true);

      try {
        const history = [...messages.slice(-8), { role: 'user', content: userText }].map((message) => ({
          role: message.role,
          content: message.content,
        }));

        const result = await apiPost('/gemini', {
          text: userText,
          history,
          settings: {
            aiName: settings.aiName,
            userName: settings.userName,
            userTitle: settings.userTitle,
            responseStyle: settings.responseStyle,
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'AI javob bermadi');
        }

        const { type, text, data } = result;

        addMessage({ role: 'assistant', content: text, type, data });

        if (type === 'task' && data?.title) {
          addTask(data);
          showToast('Vazifa saqlandi', 'success');
        } else if (type === 'reminder' && data?.title) {
          addReminder(data);
          showToast('Eslatma saqlandi', 'success');
        } else if (type === 'meeting' && data?.title) {
          addReminder({ ...data, repeat: 'none' });
          showToast('Uchrashuv saqlandi', 'success');
        } else if (type === 'money' && data?.amount !== undefined) {
          addRecord(data);
          showToast('Xarajat yozildi', 'success');
        } else if (type === 'settings') {
          applyIncomingSettings(data);
          showToast('Sozlama yangilandi', 'success');
        } else if (type === 'report') {
          showToast('Hisobot tayyorlandi', 'success');
        }

        if (settings.ttsEnabled && settings.autoVoice && text) {
          await playText(text);
        }
      } catch (err) {
        console.error('[AI ERROR]', err);
        const isRateLimit = err?.status === 429 || err?.data?.code === 'GEMINI_RATE_LIMIT';
        const errMsg = isRateLimit
          ? 'AI limiti tugagan, keyinroq urinib ko‘ring.'
          : 'Kechirasiz, hozir javob bera olmadim. Iltimos qayta urinib ko\'ring.';

        addMessage({ role: 'assistant', content: errMsg, type: 'chat', data: {} });
        showToast(
          isRateLimit ? 'AI limiti tugagan, keyinroq urinib ko‘ring' : 'Xatolik yuz berdi, qayta urinib ko\'ring',
          'error'
        );
      } finally {
        setProcessingAI(false);
      }
    },
    [
      addMessage,
      addRecord,
      addReminder,
      addTask,
      applyIncomingSettings,
      messages,
      playText,
      setProcessingAI,
      settings.aiName,
      settings.autoVoice,
      settings.responseStyle,
      settings.ttsEnabled,
      settings.userName,
      settings.userTitle,
      showToast,
    ]
  );

  const handleUserInput = useCallback(
    async (rawText) => {
      const userText = rawText.trim();
      if (!userText) return;

      addMessage({ role: 'user', content: userText, type: 'chat', data: {} });

      const handledLocally = await handleLocalCommand(userText);
      if (handledLocally) return;

      await handleAIResponse(userText);
    },
    [addMessage, handleAIResponse, handleLocalCommand]
  );

  const handleMicStart = useCallback(async () => {
    stopAudio();
    unlockAudioContext();
    const started = await startRecording();

    if (started) {
      showToast('Yozib olish boshlandi', 'info');
    }
  }, [showToast, startRecording, stopAudio, unlockAudioContext]);

  const handleMicStop = useCallback(async () => {
    showToast('Yozib olish to\'xtatildi', 'info');
    const text = await stopRecording();

    if (text) {
      showToast('Xabar yuborildi', 'success');
      await handleUserInput(text);
    }
  }, [handleUserInput, showToast, stopRecording]);

  const handleMicCancel = useCallback(async () => {
    await cancelRecording();
    showToast('Yozib olish bekor qilindi', 'info');
  }, [cancelRecording, showToast]);

  const handleTextSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    showToast('Xabar yuborildi', 'success');
    await handleUserInput(text);
  }, [handleUserInput, inputValue, showToast]);

  const handleClearChat = useCallback(() => {
    clearMessages();
    setInputValue('');
    setIsMenuOpen(false);
    setIsConfirmOpen(false);
    showToast('Chat tozalandi', 'success');
  }, [clearMessages, showToast]);

  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(224,231,255,0.95),rgba(248,250,252,0.98)_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(51,65,85,0.78),rgba(15,23,42,1)_46%)]">
      <ChatHeader
        aiName={settings.aiName || 'Kotiba'}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen((current) => !current)}
        onMenuClose={() => setIsMenuOpen(false)}
        onClearRequest={() => setIsConfirmOpen(true)}
      />

      <ChatMessages
        messages={messages}
        aiName={settings.aiName}
        userName={settings.userName}
        userTitle={settings.userTitle}
        isProcessingAI={isProcessingAI}
        onHintClick={handleUserInput}
        bottomRef={bottomRef}
      />

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleTextSend}
        onMicStart={handleMicStart}
        onMicStop={handleMicStop}
        onMicCancel={handleMicCancel}
        isRecording={isRecording}
        isProcessingSTT={isProcessingSTT}
        isSending={isProcessingAI}
        isPlayingAudio={isPlayingAudio}
      />

      <AnimatePresence>
        {isConfirmOpen && (
          <ConfirmDialog
            title="Chatni tozalash"
            message="Rostdan ham barcha xabarlarni o‘chirmoqchimisiz?"
            confirmLabel="Tozalash"
            cancelLabel="Bekor qilish"
            danger
            onConfirm={handleClearChat}
            onCancel={() => setIsConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
