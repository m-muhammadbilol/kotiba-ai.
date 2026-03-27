import 'dotenv/config';
import app from './app.js';
const PORT = process.env.PORT || 3001;

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
