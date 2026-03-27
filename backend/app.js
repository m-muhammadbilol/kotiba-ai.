import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sttRouter from './routes/stt.js';
import geminiRouter from './routes/gemini.js';
import ttsRouter from './routes/tts.js';

const app = express();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://kotiba-ai-8dgd.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const VERCEL_FRONTEND_REGEX = /^https:\/\/kotiba-ai(?:-[a-z0-9-]+)?\.vercel\.app$/i;

function splitEnvOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedOrigins() {
  return new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...splitEnvOrigins(process.env.FRONTEND_URL),
    ...splitEnvOrigins(process.env.CORS_ORIGINS),
  ]);
}

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.has(origin)) return true;
  if (VERCEL_FRONTEND_REGEX.test(origin)) return true;

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    console.error('[CORS BLOCKED ORIGIN]', origin);
    callback(new Error(`CORS ruxsati yo'q: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Accept',
    'Authorization',
    'Content-Type',
    'Origin',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'KOTIBA AI Backend ishlayapti',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'KOTIBA AI Backend ishlayapti',
  });
});

app.use('/api/gemini', geminiRouter);
app.use('/gemini', geminiRouter);
app.use('/api/stt', sttRouter);
app.use('/stt', sttRouter);
app.use('/api/tts', ttsRouter);
app.use('/tts', ttsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route topilmadi: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Server xatosi yuz berdi',
  });
});

export default app;
