import { Router, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest, requireRole } from '../middlewares/authMiddleware';

const router = Router();

type ReminderFilter = 'all' | 'pending' | 'completed';

const reminderClientSelect = {
    id: true,
    name: true,
    phone: true,
} as const;

const buildRemindAt = (date: string, time: string): Date | null => {
    const normalizedDate = String(date ?? '').trim();
    const normalizedTime = String(time ?? '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        return null;
    }

    if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
        return null;
    }

    // Локальная дата/время магазина (Бишкек UTC+6) → ISO UTC
    const remindAt = new Date(`${normalizedDate}T${normalizedTime}:00+06:00`);

    if (Number.isNaN(remindAt.getTime())) {
        return null;
    }

    return remindAt;
};

const parseFilter = (raw: unknown): ReminderFilter => {
    if (raw === 'pending' || raw === 'completed' || raw === 'all') {
        return raw;
    }

    return 'all';
};

// POST /api/reminders — создать напоминание
router.post('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientId = Number(req.body.clientId);
        const note = String(req.body.note ?? '').trim();
        const date = req.body.date;
        const time = req.body.time;

        if (!Number.isInteger(clientId) || clientId <= 0) {
            res.status(400).json({ error: 'Укажите корректный clientId' });
            return;
        }

        if (!note) {
            res.status(400).json({ error: 'Заметка обязательна' });
            return;
        }

        const remindAt = buildRemindAt(date, time);

        if (!remindAt) {
            res.status(400).json({ error: 'Укажите корректные дату и время (YYYY-MM-DD и HH:mm)' });
            return;
        }

        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { id: true },
        });

        if (!client) {
            res.status(404).json({ error: 'Клиент не найден' });
            return;
        }

        const reminder = await prisma.reminder.create({
            data: {
                note,
                remindAt,
                clientId,
                createdById: req.user?.id ?? null,
            },
            include: {
                client: {
                    select: reminderClientSelect,
                },
            },
        });

        res.status(201).json({
            message: 'Напоминание создано',
            reminder,
        });
    } catch (error) {
        console.error('Ошибка при создании напоминания:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET /api/reminders/due-count — число невыполненных due для badge
// Важно: маршрут до /:id
router.get('/due-count', verifyToken, requireRole('ADMIN', 'FLORIST'), async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const count = await prisma.reminder.count({
            where: {
                isCompleted: false,
                remindAt: {
                    lte: now,
                },
            },
        });

        res.json({ count });
    } catch (error) {
        console.error('Ошибка при получении счётчика напоминаний:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET /api/reminders?filter=all|pending|completed — только due (remindAt <= now)
router.get('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter = parseFilter(req.query.filter);
        const now = new Date();

        const reminders = await prisma.reminder.findMany({
            where: {
                remindAt: {
                    lte: now,
                },
                ...(filter === 'pending' ? { isCompleted: false } : {}),
                ...(filter === 'completed' ? { isCompleted: true } : {}),
            },
            include: {
                client: {
                    select: reminderClientSelect,
                },
            },
            orderBy: [
                { isCompleted: 'asc' },
                { remindAt: 'desc' },
            ],
        });

        res.json(reminders);
    } catch (error) {
        console.error('Ошибка при получении напоминаний:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// PATCH /api/reminders/:id/complete
router.patch('/:id/complete', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ error: 'Некорректный id напоминания' });
            return;
        }

        const existing = await prisma.reminder.findUnique({
            where: { id },
            select: { id: true, isCompleted: true },
        });

        if (!existing) {
            res.status(404).json({ error: 'Напоминание не найдено' });
            return;
        }

        const reminder = await prisma.reminder.update({
            where: { id },
            data: {
                isCompleted: true,
                completedAt: existing.isCompleted ? undefined : new Date(),
            },
            include: {
                client: {
                    select: reminderClientSelect,
                },
            },
        });

        res.json({
            message: 'Напоминание отмечено выполненным',
            reminder,
        });
    } catch (error) {
        console.error('Ошибка при завершении напоминания:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// DELETE /api/reminders/:id
router.delete('/:id', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ error: 'Некорректный id напоминания' });
            return;
        }

        const existing = await prisma.reminder.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            res.status(404).json({ error: 'Напоминание не найдено' });
            return;
        }

        await prisma.reminder.delete({
            where: { id },
        });

        res.json({ message: 'Напоминание удалено' });
    } catch (error) {
        console.error('Ошибка при удалении напоминания:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;
