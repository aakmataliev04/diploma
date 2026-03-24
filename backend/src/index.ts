import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import clientRoutes from './routes/clients';
import ordersRouter from './routes/orders';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', ordersRouter);

app.get('/api/status', async (req: Request, res: Response) => {
    try {
        //запрос в базу данных Neon
        const usersCount = await prisma.user.count();

        res.json({
            status: 'OK',
            message: 'Сервер работает, связь с базой данных установлена!',
            usersInDatabase: usersCount
        });
    } catch (error) {
        console.error('Ошибка БД:', error);
        res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});