import { Router, Request, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest, requireRole } from '../middlewares/authMiddleware';

const router = Router();



//  GET /api/clients/search?phone=0555
// Поиск клиента нужен и админу, и флористу прямо на кассе.
router.get('/search', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone } = req.query;

        if (!phone || typeof phone !== 'string') {
            res.status(400).json({ error: 'Укажите номер телефона для поиска (?phone=...)' });
            return;
        }

        // номера которые содержат введенные цифры
        const clients = await prisma.client.findMany({
            where: {
                phone: {
                    contains: phone,
                }
            },
            include: {
                events: true
            },
            take: 5 // ограничиваем 5 результатами
        });

        res.json(clients);
    } catch (error) {
        console.error('Ошибка при поиске клиента:', error);
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



export default router;
