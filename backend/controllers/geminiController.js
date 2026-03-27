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

    if (err?.status === 429 || err?.code === 'GEMINI_RATE_LIMIT') {
      return res.status(429).json({
        success: false,
        error: 'AI limiti tugagan, keyinroq urinib ko‘ring',
        code: 'GEMINI_RATE_LIMIT',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'AI xizmatida xato yuz berdi',
      code: err?.code || 'GEMINI_INTERNAL_ERROR',
    });
  }
}
