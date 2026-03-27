import fetch from 'node-fetch';
import { config } from '../config/index.js';

export const ttsService = {
  async synthesize(text, model = 'lola') {
    if (!config.uzbekVoiceApiKey) {
      throw new Error('UzbekVoice API key sozlanmagan');
    }

    const res = await fetch(`${config.uzbekVoiceBaseUrl}/tts`, {
      method: 'POST',
      headers: {
        Authorization: config.uzbekVoiceApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model,
        blocking: 'true',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TTS xatosi: ${res.status} - ${errText}`);
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('audio')) {
      return {
        audioBuffer: Buffer.from(await res.arrayBuffer()),
        contentType,
      };
    }

    const data = await res.json();

    const audioUrl =
      data.audio_url ||
      data.url ||
      data.result?.audio_url ||
      data.result?.url;

    if (audioUrl) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) {
        throw new Error(`TTS audio faylini olishda xato: ${audioRes.status}`);
      }

      return {
        audioBuffer: Buffer.from(await audioRes.arrayBuffer()),
        contentType: audioRes.headers.get('content-type') || 'audio/mpeg',
      };
    }

    if (data.audio || data.data || data.result?.audio || data.result?.data) {
      const base64 = data.audio || data.data || data.result?.audio || data.result?.data;
      return {
        audioBuffer: Buffer.from(base64, 'base64'),
        contentType:
          data.content_type ||
          data.mime_type ||
          data.result?.content_type ||
          data.result?.mime_type ||
          'audio/mpeg',
      };
    }

    if (data.id && (data.status || data.state)) {
      throw new Error(`TTS hali tayyor emas: ${data.status || data.state}`);
    }

    throw new Error('TTS javobidan audio ma\'lumot topilmadi');
  },
};
