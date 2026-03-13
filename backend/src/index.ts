import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ВАЖНО: Меняем порт на 5001, чтобы macOS (AirPlay) нам не мешал
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('🌹 Бэкенд CRM для цветочного магазина успешно запущен!');
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        message: 'API работает стабильно',
        timestamp: new Date().toISOString()
    });
});

// Вот этот блок отвечает за то, чтобы сервер "висел" и не выключался
app.listen(PORT, () => {
    console.log(`
  🚀 Сервер цветочной CRM успешно запущен!
  📍 Локальный адрес: http://localhost:${PORT}
  🛠 Режим: Разработка (TypeScript + Express)
  `);
});