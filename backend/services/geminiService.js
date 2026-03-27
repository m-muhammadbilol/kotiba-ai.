import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

const DEFAULT_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

function buildSystemPrompt(settings) {
  const aiName = settings.aiName || 'Kotiba';
  const userName = settings.userName || 'foydalanuvchi';
  const userTitle = settings.userTitle || '';
  const fullUserName = userTitle ? `${userTitle} ${userName}` : userName;
  const responseStyle = settings.responseStyle || 'oddiy';

  const styleGuide = {
    qisqa: 'Javoblaringiz juda qisqa va lo\'nda bo\'lsin. 1-2 jumladan ortiq bo\'lmasin.',
    oddiy: 'Javoblaringiz natural, oddiy va tushunarliy bo\'lsin.',
    batafsil: 'Javoblaringizda kerakli tafsilotlarni bering.',
    samimiy: 'Juda samimiy, do\'stona va iliq tonda gaplashing.',
    rasmiy: 'Rasmiy va hurmatli tonda gaplashing.',
  }[responseStyle] || 'Natural tonda gaplashing.';

  return `SEN - PROFESSIONAL O'ZBEK AI KOTIBA SAN.
SEN oddiy chatbot emassan. SEN aqlli yordamchi, boshqaruvchi va foydalanuvchining kundalik ishlarini tartibga soluvchi tizimsan.
Foydalanuvchining ismi: ${fullUserName}.
Unga ${fullUserName} deb murojaat qil.

USLUB:
- FAQAT o'zbek tilida yoz
- Robotdek emas, tabiiy, samimiy va foydali gapir
- ${styleGuide}
- Qisqa bo'lish mumkin, lekin foydalanuvchi uchun foydali bo'l
- Ortiqcha izoh, markdown, kod bloki yoki JSON tashqarisida matn yozma

ENG MUHIM QOIDA:
HAR DOIM FAQAT QUYIDAGI JSON FORMATDA JAVOB BER:
{
  "type": "chat | reminder | task | meeting | money | settings | report",
  "text": "foydalanuvchiga o'zbekcha javob",
  "data": {}
}

INTENT VA SINONIMLAR:
- "dark mode", "qorong'u rejim", "tungi rejim" -> settings
- "light mode", "yorug' rejim" -> settings
- "yoq", "och", "aktiv qil" -> yoqish
- "o'chir", "off qil", "to'xtat" -> o'chirish
- "10 sekund", "1 minut", "5 daqiqa", "1 soat", "har 10 minutda" kabi vaqt iboralarini to'g'ri tushun

TYPE LOGIC:
- chat -> oddiy suhbat
- reminder -> eslatma
- task -> vazifa
- meeting -> uchrashuv yoki qo'ng'iroq
- money -> xarajat yoki pul harakati
- settings -> sozlama, ism, tema, shrift, uslub
- report -> hisobot yoki statistika

DATA QOIDALARI:
reminder:
{
  "title": "eslatma nomi",
  "time": "ISO 8601 yoki foydalanuvchi aytgan vaqt",
  "repeat": "none | daily | weekly",
  "interval": "10m kabi qiymat yoki bo'sh string"
}

task:
{
  "title": "vazifa nomi",
  "dueTime": "ISO 8601 yoki bo'sh string",
  "priority": "low | medium | high"
}

meeting:
{
  "title": "uchrashuv nomi",
  "time": "ISO 8601 yoki foydalanuvchi aytgan vaqt",
  "location": "joy yoki platforma"
}

money:
{
  "amount": raqam,
  "category": "kategoriya",
  "currency": "UZS | USD",
  "note": "izoh"
}

settings:
{
  "theme": "dark | light | system",
  "fontSize": "kichik | medium | katta",
  "user_name": "ism",
  "responseStyle": "qisqa | oddiy | batafsil | samimiy | rasmiy"
}

report:
{
  "range": "daily | monthly | yearly",
  "table": [
    { "category": "ovqat", "amount": 100, "currency": "UZS" }
  ],
  "chart": {
    "labels": ["ovqat"],
    "values": [100]
  }
}

MUHIM XULQ:
- Yetarli ma'lumot bo'lmasa faqat 1 ta aniqlashtiruvchi savol ber va uni ham JSON formatda qaytar
- Agar foydalanuvchi eslatma so'rasa-yu vaqt aytmasa:
{
  "type": "chat",
  "text": "Qancha vaqtdan keyin yoki qaysi vaqtda eslatay?",
  "data": {}
}
- Agar foydalanuvchi sozlama aytsa, mos settings type ishlat
- Agar foydalanuvchi hisobot so'rasa, report type ishlat
- Agar foydalanuvchi zerikkanini yoki kayfiyati yo'qligini aytsa, darhol qo'shiq aytma
- Avval ruxsat so'ra:
{
  "type": "chat",
  "text": "Siz zerikib qoldingiz shekilli 🙂 Sizga bir qo'shiq aytib bersam maylimi?",
  "data": {}
}
- Faqat foydalanuvchi rozi bo'lsa 2-4 qatorli qisqa o'zbekcha qo'shiq ayt

TEKSHIRUV:
- type to'g'ri bo'lsin
- text foydalanuvchi uchun tabiiy bo'lsin
- data type ga mos va to'liq bo'lsin
- JSON buzilmasin

FAQAT JSON QAYTAR.`;
}

function sanitizeResponseText(value) {
  if (typeof value !== 'string') return '';
  const rawText = value.trim();
  if (!rawText.startsWith('{')) return rawText;

  const extracted = extractTextField(rawText);
  return extracted || rawText;
}

function safeParseGeminiResponse(text) {
  const rawText = String(text || '').trim();
  const cleaned = extractJsonCandidate(rawText);

  try {
    const parsed = JSON.parse(cleaned);

    if (!parsed.type || !parsed.text) {
      throw new Error('Noto\'g\'ri format');
    }

    const validTypes = ['chat', 'reminder', 'task', 'meeting', 'money', 'settings', 'report'];
    if (!validTypes.includes(parsed.type)) {
      parsed.type = 'chat';
    }

    parsed.text = sanitizeResponseText(parsed.text);

    if (!parsed.data || typeof parsed.data !== 'object') {
      parsed.data = {};
    }

    return parsed;
  } catch {
    const extractedText = extractTextField(cleaned) || extractTextField(rawText);
    const fallbackText = rawText.startsWith('{')
      ? extractedText || 'Kechirasiz, javobni o\'qishda xato yuz berdi.'
      : extractedText || rawText || 'Kechirasiz, javob tuzishda xato yuz berdi.';

    return {
      type: 'chat',
      text: fallbackText,
      data: {},
    };
  }
}

function extractJsonCandidate(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function extractTextField(text) {
  const match = text.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) return '';

  try {
    return JSON.parse(`"${match[1]}"`).trim();
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
  }
}

function getPreferredModels() {
  return [...new Set([config.geminiModel, ...DEFAULT_GEMINI_MODELS].filter(Boolean))];
}

function isMissingModelError(err) {
  const message = err?.message?.toLowerCase?.() || '';

  return (
    message.includes('404') ||
    message.includes('is not found') ||
    message.includes('not supported for generatecontent')
  );
}

function extractErrorStatus(err) {
  const candidates = [
    err?.status,
    err?.statusCode,
    err?.response?.status,
    err?.cause?.status,
    err?.cause?.statusCode,
    err?.errorDetails?.status,
  ];

  for (const candidate of candidates) {
    const status = Number(candidate);
    if (Number.isInteger(status) && status >= 100 && status <= 599) {
      return status;
    }
  }

  const message = err?.message || '';
  const match = message.match(/\b(429|500|503|404|403|401)\b/);
  return match ? Number(match[1]) : null;
}

function normalizeGeminiError(err) {
  const status = extractErrorStatus(err);
  const message = String(err?.message || '');
  const isRateLimited =
    status === 429 ||
    /too many requests/i.test(message) ||
    /resource has been exhausted/i.test(message) ||
    /quota/i.test(message);

  if (isRateLimited) {
    const rateLimitError = new Error('AI limiti tugagan, keyinroq urinib ko‘ring');
    rateLimitError.status = 429;
    rateLimitError.code = 'GEMINI_RATE_LIMIT';
    rateLimitError.retryable = true;
    rateLimitError.originalMessage = message;
    return rateLimitError;
  }

  if (status) {
    err.status = status;
  }

  return err;
}

export const geminiService = {
  async process(userText, history, settings) {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key sozlanmagan');
    }

    const genAI = new GoogleGenerativeAI(config.geminiApiKey);

    // Build conversation history for Gemini
    const formattedHistory = (history || [])
      .filter((m) => m.role && m.content)
      .slice(-10) // last 10 messages for context
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    let lastError;

    for (const modelName of getPreferredModels()) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: buildSystemPrompt(settings),
        });

        const chat = model.startChat({
          history: formattedHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        const result = await chat.sendMessage(userText);
        const responseText = result.response.text();

        return safeParseGeminiResponse(responseText);
      } catch (err) {
        lastError = err;

        if (!isMissingModelError(err)) {
          throw normalizeGeminiError(err);
        }

        console.warn(`[GEMINI] Model ishlamadi: ${modelName}. Keyingisi sinab ko'riladi.`);
      }
    }

    throw new Error(
      `Gemini modeli topilmadi. backend/.env ichida GEMINI_MODEL ni yangilang. So'nggi xato: ${lastError?.message || 'noma\'lum xato'}`
    );
  },
};
