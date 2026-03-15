import { Router, Request, Response } from 'express';
import prisma from '../db';
import jwt from 'jsonwebtoken';
import { verifyToken, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// /api/auth/login для входа по ПИН-коду
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
            const { pin } = req.body;

        if (!pin) {
            res.status(400).json({ error: 'ПИН-код обязателен' });
            return;
        }

        // ищем сотрудника в базе
        const user = await prisma.user.findUnique({
            where: { pin: String(pin) }
        });

        if (!user) {
            res.status(401).json({ error: 'Неверный ПИН-код' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '12h' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});



// /api/auth/me защищенный роут для получения профиля
router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // засчет middleware verifyToken, мы точно знаем, что req.user есть
        const userId = req.user?.id;

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { id: true, name: true, role: true, createdAt: true } // пин-код не отдаем в целях безопасности!
        });

        if (!user) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});



export default router;