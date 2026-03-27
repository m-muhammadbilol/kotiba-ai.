import { ttsService } from '../services/ttsService.js';

export async function synthesizeSpeech(req, res) {
  try {
    const { text, model } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Matn bo\'sh bo\'lishi mumkin emas',
      });
    }

    const { audioBuffer, contentType } = await ttsService.synthesize(text.trim(), model || 'lola');

    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  } catch (err) {
    console.error('[TTS ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'TTS xizmatida xato yuz berdi',
    });
  }
}
