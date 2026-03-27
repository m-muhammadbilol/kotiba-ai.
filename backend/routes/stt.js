import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../controllers/sttController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  transcribeAudio
);

export default router;
