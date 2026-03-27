import { geminiService } from '../services/geminiService.js';

export async function processWithGemini(req, res) {
  try {
    const { text, history, settings } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Matn bo\'sh bo\'lishi mumkin emas',
      });
    }

    const result = await geminiService.process(text.trim(), history || [], settings || {});

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[GEMINI ERROR]', err);

    if (err?.status === 429 || err?.code === 'OPENAI_RATE_LIMIT') {
      return res.status(429).json({
        success: false,
        error: 'AI limiti tugagan, keyinroq urinib ko‘ring',
        code: 'OPENAI_RATE_LIMIT',
      });
    }

    if (err?.message?.includes('OpenAI API key sozlanmagan')) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key sozlanmagan',
        code: 'OPENAI_API_KEY_MISSING',
      });
    }

    if (err?.code === 'OPENAI_AUTH_ERROR') {
      return res.status(401).json({
        success: false,
        error: err.message,
        code: err.code,
      });
    }

    if (err?.code === 'OPENAI_MODEL_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: err.message,
        code: err.code,
      });
    }

    return res.status(err?.status || 500).json({
      success: false,
      error: err?.message || 'AI xizmatida xato yuz berdi',
      code: err?.code || 'OPENAI_INTERNAL_ERROR',
    });
  }
}
