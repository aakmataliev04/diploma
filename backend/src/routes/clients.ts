import { Router, Request, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest, requireRole } from '../middlewares/authMiddleware';

const router = Router();



//  GET /api/clients/search?q=0555
// Поиск клиента нужен и админу, и флористу прямо на кассе.
router.get('/search', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const rawQuery = typeof req.query.q === 'string'
            ? req.query.q.trim()
            : typeof req.query.phone === 'string'
                ? req.query.phone.trim()
                : '';

        if (!rawQuery) {
            res.status(400).json({ error: 'Укажите строку для поиска (?q=...)' });
            return;
        }

        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    {
                        phone: {
                            contains: rawQuery,
                        }
                    },
                    {
                        name: {
                            contains: rawQuery,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            orderBy: { id: 'desc' },
            include: {
                events: true
            },
            take: 12
        });

        res.json(clients);
    } catch (error) {
        console.error('Ошибка при поиске клиента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


router.get('/upcoming', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfUpcomingPeriod = new Date(startOfToday.getTime() + 7 * 86400000);

        const clients = await prisma.client.findMany({
            where: {
                events: {
                    some: {
                        date: {
                            gte: startOfToday,
                            lte: endOfUpcomingPeriod
                        }
                    }
                }
            },
            include: {
                events: {
                    where: {
                        date: {
                            gte: startOfToday,
                            lte: endOfUpcomingPeriod
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                }
            }
        });

        const sortedClients = clients.sort((leftClient, rightClient) => {
            const leftDate = leftClient.events[0] ? new Date(leftClient.events[0].date).getTime() : Number.MAX_SAFE_INTEGER;
            const rightDate = rightClient.events[0] ? new Date(rightClient.events[0].date).getTime() : Number.MAX_SAFE_INTEGER;

            return leftDate - rightDate;
        });

        res.json(sortedClients);
    } catch (error) {
        console.error('Ошибка при получении ближайших событий клиентов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});




router.get('/', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // достаем все обьекты из clients вместе с их поводами
        const clients = await prisma.client.findMany({
            orderBy: { id: 'desc' },
            include: {
                events: true
            }
        });

        res.json(clients);
    } catch (error) {
        console.error('Ошибка при получении клиентов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});




//  /api/clients
router.post('/', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, name, events } = req.body;

        if (!phone) {
            res.status(400).json({ error: 'Номер телефона обязателен' });
            return;
        }

        const existingClient = await prisma.client.findUnique({ where: { phone: String(phone) } });
        if (existingClient) {
            res.status(400).json({ error: 'Клиент с таким номером уже существует' });
            return;
        }

        // создаем клиента и привязываем к нему поводы
        const newClient = await prisma.client.create({
            data: {
                phone: String(phone),
                name: name ? String(name) : null,

                // если массив events exist создаем обьект
                events: events && events.length > 0 ? {
                    create: events.map((e: any) => ({
                        title: String(e.title),
                        date: new Date(e.date) // меняем формат DateTime
                    }))
                } : undefined
            },
            include: {
                events: true
            }
        });

        res.status(201).json({
            message: 'Клиент успешно добавлен',
            client: newClient
        });
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


// добавление повода клиенту
router.post('/:id/events', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientId = Number(req.params.id);
        const { title, date } = req.body;

        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            res.status(404).json({ error: 'Клиент не найден' });
            return;
        }

        // новый повод и привязываем к клиенту
        const newEvent = await prisma.clientEvent.create({
            data: {
                title: String(title),
                date: new Date(date), // Превращаем строку в правильную дату для базы
                clientId: clientId
            }
        });

        res.status(201).json({
            message: 'Повод успешно добавлен',
            event: newEvent
        });
    } catch (error) {
        console.error('Ошибка при добавлении повода:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


// изменение клиента и его событий
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientId = Number(req.params.id);
        const { name, phone, events } = req.body;

        if (Number.isNaN(clientId)) {
            res.status(400).json({ error: 'Некорректный id клиента' });
            return;
        }

        const existingClient = await prisma.client.findUnique({
            where: { id: clientId },
            include: { events: true }
        });

        if (!existingClient) {
            res.status(404).json({ error: 'Клиент не найден' });
            return;
        }

        const normalizedPhone = phone !== undefined ? String(phone).trim() : existingClient.phone;
        const normalizedName = name !== undefined
            ? (String(name).trim() ? String(name).trim() : null)
            : existingClient.name;

        if (!normalizedPhone) {
            res.status(400).json({ error: 'Номер телефона обязателен' });
            return;
        }

        const clientWithSamePhone = await prisma.client.findFirst({
            where: {
                phone: normalizedPhone,
                NOT: { id: clientId }
            }
        });

        if (clientWithSamePhone) {
            res.status(400).json({ error: 'Клиент с таким номером уже существует' });
            return;
        }

        const updatedClient = await prisma.$transaction(async (tx) => {
            await tx.client.update({
                where: { id: clientId },
                data: {
                    name: normalizedName,
                    phone: normalizedPhone
                }
            });

            if (Array.isArray(events)) {
                await tx.clientEvent.deleteMany({
                    where: { clientId }
                });

                const sanitizedEvents = events
                    .filter((event: any) => event?.title && event?.date)
                    .map((event: any) => ({
                        title: String(event.title).trim(),
                        date: new Date(event.date),
                        clientId
                    }))
                    .filter((event) => event.title !== '' && !Number.isNaN(event.date.getTime()));

                if (sanitizedEvents.length > 0) {
                    await tx.clientEvent.createMany({
                        data: sanitizedEvents
                    });
                }
            }

            return tx.client.findUnique({
                where: { id: clientId },
                include: {
                    events: true
                }
            });
        });

        res.json({
            message: 'Клиент успешно обновлен',
            client: updatedClient
        });
    } catch (error) {
        console.error('Ошибка при обновлении клиента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});



export default router;
