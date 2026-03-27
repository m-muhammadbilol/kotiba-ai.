import express from 'express';
import { processWithGemini } from '../controllers/geminiController.js';

const router = express.Router();

router.post('/', processWithGemini);

export default router;
