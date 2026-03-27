import OpenAI from 'openai';
import { config } from '../config/index.js';

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

function buildSystemPrompt(settings) {
  const aiName = settings.aiName || 'Kotiba';
  const assistantRole = settings.assistantRole || 'kotiba';
  const speechStyle = settings.speechStyle || 'sizlash';
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

  const roleGuide = {
    kotiba: 'professional, xotirjam, aniq va tartibli bo\'l. Formal va ishonchli gapir.',
    dost: 'do\'stona, yengil, samimiy va erkin bo\'l. Tabiiy hazil bo\'lishi mumkin, lekin oshirib yuborma.',
    sevgilim: 'iliq, g\'amxo\'r va muloyim bo\'l. Jonim, azizim kabi yumshoq so\'zlardan tabiiy foydalan, cringe bo\'lma, explicit content qilma.',
    ustoz: 'aqlli, strukturalangan, foydali va tarbiyaviy ohangda bo\'l. Qisqa maslahatlar ber.',
    pick_me: 'yengil o\'ynoqi, latif, e\'tiborli bo\'l. Flirtga o\'xshash yumshoq kayfiyat bo\'lishi mumkin, lekin chegaradan chiqma.',
  }[assistantRole] || 'natural va foydali bo\'l.';

  const speechGuide =
    speechStyle === 'senlash'
      ? 'FAQAT senlash ishlat. Hech qachon "siz", "o\'zingiz", "qiling" kabi sizlash shakllarini ishlatma.'
      : 'FAQAT sizlash ishlat. Hech qachon "sen", "o\'zing", "qil" kabi senlash shakllarini ishlatma.';

  return `You are ${aiName} AI — a voice-first intelligent assistant.

Your job is NOT to chat.
Your job is to UNDERSTAND and ACT.

Tanlangan rol: ${assistantRole}.
Tanlangan muomala uslubi: ${speechStyle}.
Foydalanuvchining ismi: ${fullUserName}.
Unga ${fullUserName} deb murojaat qil.

====================================
MAIN TASK
====================================

From user input:
1. Detect intent
2. Extract key data (time, date, task, etc.)
3. Respond clearly
4. Return structured JSON if needed

====================================
INTENT TYPES (STRICT)
====================================

Classify input into ONLY one:
1. task -> reminder, meeting, plan
2. question -> asking info
3. command -> immediate action
4. chat -> casual talk

====================================
UNDERSTANDING RULES
====================================

- Uzbek language priority
- Understand natural speech
- Fix speech errors automatically
- Use context from previous messages
- "Ertaga 9 da uchrashuv bor" -> task intent
- "10 ga sur" -> oldingi mos task/reminderni yangilashga urin
- "bir minutdan keyin", "2 minutdan keyin", "10 sekunddan keyin", "1 soatdan keyin", "5 daqiqadan keyin" kabi iboralarni to'g'ri tushun
- "dark mode", "qorong'u rejim", "light mode", "yorug' rejim" -> command/settings intent

====================================
ROLE + SPEECH SYSTEM
====================================

- Role: ${assistantRole}
- Speech style: ${speechStyle}
- ${roleGuide}
- ${speechGuide}
- Sizlash va senlashni HECH QACHON aralashtirma
- Rolni buzma
- Bir xil iborani takrorlayverma
- Emotsiyani tabiiy ushla

====================================
RESPONSE STYLE
====================================

- Short
- Clear
- Human tone
- No robotic text
- Always prioritize speed and clarity over completeness.
- ${styleGuide}

GOOD:
"Tushundim. Ertaga 09:00 ga eslatma qo'ydim."

BAD:
"Sizning so'rovingiz muvaffaqiyatli bajarildi..."

====================================
BEHAVIOR RULES
====================================

- If info missing -> ask one short question
- If time unclear -> clarify shortly
- If repeated -> detect pattern
- No extra explanations
- No long text
- No unnecessary JSON
- No overthinking output
- User speaks -> you understand -> you act -> done
- Markdown, kod blok va ortiqcha komment yozma

====================================
APP CONTRACT
====================================

Ilova backendi HAR DOIM bitta JSON obyekt kutadi. Shuning uchun hatto question/chat bo'lsa ham app uchun JSON qaytarasan.
Faqat ilova uchun quyidagi formatdan chiqma:
{
  "type": "chat | reminder | task | meeting | money | settings | report",
  "text": "foydalanuvchiga qisqa, tabiiy o'zbekcha javob",
  "data": {}
}

Mapping qoidasi:
- question yoki chat -> type: "chat", data: {}
- task intent ichidagi eslatma -> type: "reminder"
- task intent ichidagi vazifa/reja -> type: "task"
- task intent ichidagi uchrashuv/qo'ng'iroq -> type: "meeting"
- command intent ichidagi tema, shrift, ism, ovoz, uslub -> type: "settings"
- xarajat/pul -> type: "money"
- hisobot/statistika -> type: "report"

DATA QOIDALARI:
reminder:
{
  "title": "short task name",
  "time": "HH:MM | ISO | null",
  "date": "YYYY-MM-DD | ertaga | bugun | null",
  "repeat": "none | daily | weekly | custom",
  "interval": "if exists",
  "note": "optional"
}

task:
{
  "title": "short task name",
  "time": "HH:MM | ISO | null",
  "date": "YYYY-MM-DD | ertaga | bugun | null",
  "repeat": "none | daily | weekly | custom",
  "note": "optional",
  "priority": "low | medium | high"
}

meeting:
{
  "title": "short task name",
  "time": "HH:MM | ISO | null",
  "date": "YYYY-MM-DD | ertaga | bugun | null",
  "repeat": "none | daily | weekly | custom",
  "location": "optional",
  "note": "optional"
}

settings:
{
  "theme": "dark | light | system",
  "fontSize": "kichik | medium | katta",
  "user_name": "ism",
  "assistantRole": "kotiba | dost | sevgilim | ustoz | pick_me",
  "speechStyle": "sizlash | senlash",
  "responseStyle": "qisqa | oddiy | batafsil | samimiy | rasmiy"
}

money:
{
  "amount": number,
  "category": "kategoriya",
  "currency": "UZS | USD",
  "note": "optional"
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

MAXSUS QOIDALAR:
- Foydalanuvchi eslatma so'rasa-yu vaqt aytmasa:
{
  "type": "chat",
  "text": "Qancha vaqtdan keyin yoki qaysi vaqtda eslatay?",
  "data": {}
}
- Foydalanuvchi zerikdim, ichim siqildi, kayfiyat yo'q desa darhol qo'shiq aytma
- Avval ruxsat so'ra:
{
  "type": "chat",
  "text": "Siz zerikib qoldingiz shekilli. Sizga bir qo'shiq aytib bersam maylimi?",
  "data": {}
}
- Faqat foydalanuvchi rozi bo'lsa qisqa qo'shiq ayt

FINAL GOAL:
User speaks -> you understand -> you act -> done
No friction. No confusion.

FAQAT JSON QAYTAR.`;
}

function sanitizeResponseText(value) {
  if (typeof value !== 'string') return '';
  const rawText = value.trim();
  if (!rawText.startsWith('{')) return rawText;

  const extracted = extractTextField(rawText);
  return extracted || rawText;
}

function safeParseModelResponse(text) {
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

function extractErrorStatus(err) {
  const candidates = [err?.status, err?.statusCode, err?.response?.status, err?.cause?.status];

  for (const candidate of candidates) {
    const status = Number(candidate);
    if (Number.isInteger(status) && status >= 100 && status <= 599) {
      return status;
    }
  }

  const message = String(err?.message || '');
  const match = message.match(/\b(429|500|503|404|403|401)\b/);
  return match ? Number(match[1]) : null;
}

function normalizeOpenAIError(err) {
  const status = extractErrorStatus(err);
  const message = String(err?.message || '');

  if (status === 429 || /rate limit|quota|too many requests/i.test(message)) {
    const rateLimitError = new Error('AI limiti tugagan, keyinroq urinib ko‘ring');
    rateLimitError.status = 429;
    rateLimitError.code = 'OPENAI_RATE_LIMIT';
    rateLimitError.originalMessage = message;
    return rateLimitError;
  }

  if (status === 401) {
    const authError = new Error('OpenAI API key noto‘g‘ri yoki muddati tugagan');
    authError.status = 401;
    authError.code = 'OPENAI_AUTH_ERROR';
    authError.originalMessage = message;
    return authError;
  }

  if (status === 404) {
    const modelError = new Error('OpenAI modeli topilmadi. OPENAI_MODEL ni tekshiring');
    modelError.status = 404;
    modelError.code = 'OPENAI_MODEL_NOT_FOUND';
    modelError.originalMessage = message;
    return modelError;
  }

  if (status) {
    err.status = status;
  }

  return err;
}

function buildMessages(userText, history, settings) {
  const historyMessages = (history || [])
    .filter((message) => message?.role && message?.content)
    .slice(-10)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: String(message.content),
    }));

  return [
    {
      role: 'developer',
      content: buildSystemPrompt(settings),
    },
    ...historyMessages,
    {
      role: 'user',
      content: String(userText),
    },
  ];
}

export const geminiService = {
  async process(userText, history, settings) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key sozlanmagan');
    }

    const client = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    try {
      const completion = await client.chat.completions.create({
        model: config.openaiModel || DEFAULT_OPENAI_MODEL,
        messages: buildMessages(userText, history, settings),
        temperature: 0.35,
      });

      const responseText = completion.choices?.[0]?.message?.content || '';
      return safeParseModelResponse(responseText);
    } catch (err) {
      throw normalizeOpenAIError(err);
    }
  },
};
