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

    const result = await sttService.startTranscription({
      audioBuffer: uploadedFile.buffer,
      mimeType: uploadedFile.mimetype || 'audio/webm',
      filename: uploadedFile.originalname || 'recording.webm',
    });

    return res.status(result.state === 'completed' ? 200 : 202).json({
      success: true,
      text: result.text || '',
      taskId: result.taskId || '',
      state: result.state,
    });
  } catch (err) {
    console.error('[STT ERROR]', err);
    return res.status(err?.status || 500).json({
      success: false,
      error: err.message || 'STT xizmatida xato yuz berdi',
    });
  }
}

export async function getTranscriptionStatus(req, res) {
  try {
    const taskId = String(req.params.taskId || '').trim();

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'STT task ID topilmadi',
      });
    }

    const result = await sttService.getTranscriptionStatus(taskId);

    return res.status(result.state === 'completed' ? 200 : 202).json({
      success: true,
      text: result.text || '',
      taskId: result.taskId || taskId,
      state: result.state,
    });
  } catch (err) {
    console.error('[STT STATUS ERROR]', err);
    return res.status(err?.status || 500).json({
      success: false,
      error: err.message || 'STT statusini olishda xato yuz berdi',
    });
  }
}
