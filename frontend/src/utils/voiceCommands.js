function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʻʼ'`’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(normalizeText(phrase)));
}

function isShortExplicitCommand(text, keywords) {
  const words = text.split(' ').filter(Boolean);
  const hasKeyword = includesAny(text, keywords);
  const hasActionWord = includesAny(text, [
    'och',
    'ochib',
    'kir',
    'kirib',
    'bor',
    'ot',
    'otkaz',
    'korsat',
  ]);

  return hasKeyword && (hasActionWord || words.length <= 3);
}

function isTimeRequest(text) {
  return (
    text.includes('soat nech') ||
    text.includes('vaqt nech') ||
    includesAny(text, [
      'hozir soat',
      'aniq vaqt',
      'hozirgi vaqt',
      'vaqtni ayt',
      'soatni ayt',
      'soat qancha',
    ])
  );
}

export function resolveVoiceCommand(input) {
  const text = normalizeText(input);
  if (!text) return null;

  if (includesAny(text, ['hammasini ochir', 'hammasini tozala', 'barchasini ochir', 'barcha malumotni ochir'])) {
    return {
      type: 'clear',
      value: 'all',
      response: 'Barcha ma\'lumotlar tozalandi.',
      toastType: 'info',
    };
  }

  if (includesAny(text, ['chatni tozala', 'chat tarixini ochir', 'xabarlarni ochir', 'chatni delete qil', 'chatni ochir'])) {
    return {
      type: 'clear',
      value: 'messages',
      response: 'Chat tarixi tozalandi.',
      toastType: 'info',
    };
  }

  if (includesAny(text, ['vazifalarni ochir', 'vazifalarni tozala', 'vazifalarni delete qil'])) {
    return {
      type: 'clear',
      value: 'tasks',
      response: 'Barcha vazifalar o\'chirildi.',
      toastType: 'info',
    };
  }

  if (includesAny(text, ['eslatmalarni ochir', 'eslatmalarni tozala', 'eslatmalarni delete qil'])) {
    return {
      type: 'clear',
      value: 'reminders',
      response: 'Barcha eslatmalar o\'chirildi.',
      toastType: 'info',
    };
  }

  if (includesAny(text, ['xarajatlarni ochir', 'xarajat tarixini ochir', 'xarajatlarni tozala'])) {
    return {
      type: 'clear',
      value: 'money',
      response: 'Xarajatlar tarixi tozalandi.',
      toastType: 'info',
    };
  }

  if (includesAny(text, ['dark mode', 'qora rejim', 'qorongi rejim', 'qoro rejim', 'tungi rejim'])) {
    return {
      type: 'theme',
      value: 'dark',
      response: 'Qorong\'i rejim yoqildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['light mode', 'oq rejim', 'yorug rejim', 'yorqin rejim'])) {
    return {
      type: 'theme',
      value: 'light',
      response: 'Yorug\' rejim yoqildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['tizim rejimi', 'system mode'])) {
    return {
      type: 'theme',
      value: 'system',
      response: 'Mavzu tizim holatiga qaytarildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['kichik shrift', 'shriftni kichik qil', 'kichikroq shrift'])) {
    return {
      type: 'fontSize',
      value: 'kichik',
      response: 'Shrift kichik holatga o\'tkazildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['orta shrift', 'ortacha shrift', 'medium shrift', 'shriftni orta qil'])) {
    return {
      type: 'fontSize',
      value: 'medium',
      response: 'Shrift o\'rta holatga o\'tkazildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['katta shrift', 'shriftni katta qil', 'shriftni kattalashtir'])) {
    return {
      type: 'fontSize',
      value: 'katta',
      response: 'Shrift kattaroq qilindi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['qisqa javob', 'javob usulini qisqa qil', 'qisqa usul'])) {
    return {
      type: 'responseStyle',
      value: 'qisqa',
      response: 'Javob uslubi qisqa ko\'rinishga o\'tdi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['samimiy javob', 'javob usulini samimiy qil'])) {
    return {
      type: 'responseStyle',
      value: 'samimiy',
      response: 'Javob uslubi samimiy ko\'rinishga o\'tdi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['batafsil javob', 'javob usulini batafsil qil'])) {
    return {
      type: 'responseStyle',
      value: 'batafsil',
      response: 'Javob uslubi batafsil ko\'rinishga o\'tdi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['rasmiy javob', 'javob usulini rasmiy qil'])) {
    return {
      type: 'responseStyle',
      value: 'rasmiy',
      response: 'Javob uslubi rasmiy ko\'rinishga o\'tdi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['ovozni yoq', 'ttsni yoq', 'ovozli javobni yoq'])) {
    return {
      type: 'voice',
      value: { ttsEnabled: true, autoVoice: true },
      response: 'Ovozli javob yoqildi.',
      toastType: 'success',
    };
  }

  if (includesAny(text, ['ovozni ochir', 'ttsni ochir', 'ovozli javobni ochir'])) {
    return {
      type: 'voice',
      value: { ttsEnabled: false, autoVoice: false },
      response: 'Ovozli javob o\'chirildi.',
      toastType: 'info',
      skipVoiceReply: true,
    };
  }

  if (isTimeRequest(text)) {
    return {
      type: 'time',
      value: 'current',
      toastType: 'info',
    };
  }

  if (isShortExplicitCommand(text, ['chat', 'suhbat'])) {
    return {
      type: 'navigate',
      value: '/',
      response: 'Chat sahifasi ochildi.',
      toastType: 'success',
    };
  }

  if (isShortExplicitCommand(text, ['vazifalar', 'vazifa sahifasi'])) {
    return {
      type: 'navigate',
      value: '/tasks',
      response: 'Vazifalar sahifasi ochildi.',
      toastType: 'success',
    };
  }

  if (isShortExplicitCommand(text, ['eslatmalar', 'eslatma sahifasi'])) {
    return {
      type: 'navigate',
      value: '/reminders',
      response: 'Eslatmalar sahifasi ochildi.',
      toastType: 'success',
    };
  }

  if (isShortExplicitCommand(text, ['xarajatlar', 'xarajat sahifasi'])) {
    return {
      type: 'navigate',
      value: '/money',
      response: 'Xarajatlar sahifasi ochildi.',
      toastType: 'success',
    };
  }

  if (isShortExplicitCommand(text, ['sozlamalar', 'sozlama sahifasi'])) {
    return {
      type: 'navigate',
      value: '/settings',
      response: 'Sozlamalar sahifasi ochildi.',
      toastType: 'success',
    };
  }

  return null;
}
