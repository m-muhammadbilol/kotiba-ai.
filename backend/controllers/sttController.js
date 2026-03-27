import { sttService } from '../services/sttService.js';

function resolveUploadedFile(req) {
  if (req.file) return req.file;
  if (req.files?.file?.[0]) return req.files.file[0];
  if (req.files?.audio?.[0]) return req.files.audio[0];
  return null;
}

export async function transcribeAudio(req, res) {
  try {
    const uploadedFile = resolveUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio fayl topilmadi',
      });
    }

    const transcript = await sttService.transcribe({
      audioBuffer: uploadedFile.buffer,
      mimeType: uploadedFile.mimetype || 'audio/webm',
      filename: uploadedFile.originalname || 'recording.webm',
    });

    return res.json({
      success: true,
      text: transcript,
    });
  } catch (err) {
    console.error('[STT ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'STT xizmatida xato yuz berdi',
    });
  }
}
