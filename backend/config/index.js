export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  uzbekVoiceApiKey: process.env.UZBEKVOICE_API_KEY || '',
  uzbekVoiceBaseUrl: 'https://uzbekvoice.ai/api/v1',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || '*',
};

export function validateConfig() {
  const missing = [];
  if (!config.openaiApiKey) missing.push('OPENAI_API_KEY');
  if (!config.uzbekVoiceApiKey) missing.push('UZBEKVOICE_API_KEY');
  if (missing.length > 0) {
    console.warn(`⚠️  Quyidagi env o'zgaruvchilari topilmadi: ${missing.join(', ')}`);
  }
}
