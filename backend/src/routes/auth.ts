import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyToken, AuthRequest, requireRole, UserRole } from '../middlewares/authMiddleware';

const router = Router();
const PIN_SALT_ROUNDS = 10;

const findUserByPin = async (plainPin: string) => {
    const users = await prisma.user.findMany();

    // PIN хранится только в виде bcrypt-хэша, поэтому ищем сотрудника сравнением через compare.
    for (const user of users) {
        const isMatch = await bcrypt.compare(plainPin, user.pin);

        if (isMatch) {
            return user;
        }
    }

    return null;
};

const isPinAlreadyUsed = async (plainPin: string) => {
    const match = await findUserByPin(plainPin);
    return Boolean(match);
};

const allowBootstrapOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const usersCount = await prisma.user.count();

        // разрешаем публичную регистрацию только для самого первого сотрудника
        if (usersCount === 0) {
            next();
            return;
        }

        verifyToken(req, res, () => requireRole('ADMIN')(req, res, next));
    } catch (error) {
        console.error('Ошибка проверки доступа к регистрации:', error);
        res.status(500).json({ error: 'Не удалось проверить права на регистрацию' });
    }
};

// /api/auth/register — Регистрация нового сотрудника
router.post('/register', allowBootstrapOrAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, pin, role } = req.body;
        const normalizedRole = String(role).toUpperCase() as UserRole;
        const normalizedPin = String(pin);
        const usersCount = await prisma.user.count();

        if (!name || !pin || !role) {
            res.status(400).json({ error: 'Имя, ПИН-код и роль обязательны' });
            return;
        }

        if (normalizedRole !== 'ADMIN' && normalizedRole !== 'FLORIST') {
            res.status(400).json({ error: 'Допустимые роли: ADMIN или FLORIST' });
            return;
        }

        // Первый пользователь в системе должен быть администратором.
        if (usersCount === 0 && normalizedRole !== 'ADMIN') {
            res.status(400).json({ error: 'Первый пользователь системы должен быть зарегистрирован с ролью ADMIN' });
            return;
        }

        if (normalizedRole === 'ADMIN' && normalizedPin.length < 8) {
            res.status(400).json({ error: 'Пароль администратора должен быть не менее 8 символов' });
            return;
        }

        if (normalizedRole === 'FLORIST' && normalizedPin.length !== 4) {
            res.status(400).json({ error: 'ПИН-код флориста должен состоять из 4 цифр' });
            return;
        }

        if (await isPinAlreadyUsed(normalizedPin)) {
            res.status(400).json({ error: 'Этот ПИН-код уже используется другим сотрудником' });
            return;
        }

        // В базе хранится не сам PIN, а его безопасный хэш.
        const hashedPin = await bcrypt.hash(normalizedPin, PIN_SALT_ROUNDS);

        // Создание пользователя в базе
        const newUser = await prisma.user.create({
            data: {
                name: String(name),
                pin: hashedPin,
                role: normalizedRole
            }
        });

        res.status(201).json({
            message: 'Сотрудник успешно зарегистрирован',
            user: {
                id: newUser.id,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error: any) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// /api/auth/login для входа по ПИН-коду
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
            const { pin } = req.body;
        const normalizedPin = String(pin);

        if (!pin) {
            res.status(400).json({ error: 'ПИН-код обязателен' });
            return;
        }

        // После хэширования PIN ищем пользователя через bcrypt.compare, а не через findUnique.
        const user = await findUserByPin(normalizedPin);

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
