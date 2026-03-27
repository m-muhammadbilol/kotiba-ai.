import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sttRouter from './routes/stt.js';
import geminiRouter from './routes/gemini.js';
import ttsRouter from './routes/tts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/stt', sttRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/tts', ttsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'KOTIBA AI Backend ishlayapti' });
});

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Server xatosi yuz berdi',
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ KOTIBA AI Backend port ${PORT} da ishlamoqda`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️  Port ${PORT} allaqachon band. Ehtimol backend allaqachon ishlayapti.`);
    console.error(`Agar qayta ishga tushirmoqchi bo'lsangiz, avval shu portdagi eski processni to'xtating.`);
    process.exit(0);
  }

  throw err;
});
