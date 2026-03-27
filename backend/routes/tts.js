import express from 'express';
import { synthesizeSpeech } from '../controllers/ttsController.js';

const router = express.Router();

router.post('/', synthesizeSpeech);

export default router;
