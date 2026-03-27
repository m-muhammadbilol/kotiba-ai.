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
    return res.status(500).json({
      success: false,
      error: err.message || 'AI xizmatida xato yuz berdi',
    });
  }
}
