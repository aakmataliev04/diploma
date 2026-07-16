import { Router, Request, Response } from 'express';
import prisma from '../db';
import { verifyToken, requireRole } from '../middlewares/authMiddleware';

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

const router = Router();

type OrdersPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type OrdersSegment = 'all' | 'anonymous' | 'loyalty';

const orderDetailInclude = {
    client: {
        select: {
            id: true,
            name: true,
            phone: true,
            ordersCount: true,
        },
    },
    createdBy: {
        select: {
            id: true,
            name: true,
            role: true,
        },
    },
    items: {
        include: {
            item: {
                select: {
                    id: true,
                    name: true,
                    category: true,
                },
            },
        },
    },
    bouquets: {
        include: {
            bouquetTemplate: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
} as const;

const startOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};

const endOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
};

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const resolvePeriodRange = (
    period: OrdersPeriod,
    fromRaw?: string,
    toRaw?: string,
): { start: Date; end: Date } => {
    const now = new Date();

    if (period === 'yesterday') {
        const yesterday = addDays(startOfDay(now), -1);
        return { start: yesterday, end: endOfDay(yesterday) };
    }

    if (period === 'week') {
        return { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
    }

    if (period === 'month') {
        return { start: startOfDay(addDays(now, -29)), end: endOfDay(now) };
    }

    if (period === 'custom') {
        if (!fromRaw || !toRaw) {
            throw new Error('Для произвольного периода укажите from и to (YYYY-MM-DD)');
        }

        const start = startOfDay(new Date(`${fromRaw}T00:00:00`));
        const end = endOfDay(new Date(`${toRaw}T00:00:00`));

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new Error('Некорректный формат дат from/to');
        }

        if (start.getTime() > end.getTime()) {
            throw new Error('Дата начала не может быть позже даты окончания');
        }

        return { start, end };
    }

    // today (default)
    return { start: startOfDay(now), end: endOfDay(now) };
};

const parsePeriod = (raw: unknown): OrdersPeriod => {
    if (raw === 'yesterday' || raw === 'week' || raw === 'month' || raw === 'custom' || raw === 'today') {
        return raw;
    }
    return 'today';
};

const parseSegment = (raw: unknown): OrdersSegment => {
    if (raw === 'anonymous' || raw === 'loyalty' || raw === 'all') {
        return raw;
    }
    return 'all';
};

const getPositionsCount = (order: {
    items: Array<{ quantity: number }>;
    bouquets: Array<{ quantity: number }>;
}) => {
    const itemsQty = order.items.reduce((sum, row) => sum + row.quantity, 0);
    const bouquetsQty = order.bouquets.reduce((sum, row) => sum + row.quantity, 0);
    return itemsQty + bouquetsQty;
};

const parseDiscountPercent = (raw: unknown): number | null => {
    if (raw === undefined || raw === null || raw === '') {
        return null;
    }

    const value = Number(raw);

    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error('Процент скидки должен быть целым числом');
    }

    if (value < 0 || value > 100) {
        throw new Error('Процент скидки должен быть от 0 до 100');
    }

    if (value === 0) {
        return null;
    }

    return value;
};

// GET /api/orders — список + summary за период
router.get('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const period = parsePeriod(req.query.period);
        const segment = parseSegment(req.query.segment);
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const source =
            typeof req.query.source === 'string' && req.query.source.trim() !== '' && req.query.source !== 'all'
                ? req.query.source.trim()
                : null;
        const from = typeof req.query.from === 'string' ? req.query.from : undefined;
        const to = typeof req.query.to === 'string' ? req.query.to : undefined;

        const { start, end } = resolvePeriodRange(period, from, to);
        const dateWhere = { createdAt: { gte: start, lte: end } };

        // KPI только по периоду
        const summaryOrders = await prisma.order.findMany({
            where: dateWhere,
            select: {
                totalPrice: true,
                clientId: true,
            },
        });

        const ordersCount = summaryOrders.length;
        const revenue = summaryOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const anonymousCount = summaryOrders.filter((order) => order.clientId === null).length;
        const averageCheck = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

        const listWhere: Record<string, unknown> = {
            ...dateWhere,
        };

        if (source) {
            listWhere.source = source;
        }

        if (segment === 'anonymous') {
            listWhere.clientId = null;
        } else if (segment === 'loyalty') {
            listWhere.client = {
                ordersCount: { gte: 7 },
            };
        }

        if (q) {
            const numericId = Number(q.replace(/\D/g, ''));
            const orFilters: Array<Record<string, unknown>> = [
                {
                    client: {
                        phone: { contains: q },
                    },
                },
                {
                    client: {
                        name: { contains: q, mode: 'insensitive' },
                    },
                },
            ];

            if (Number.isInteger(numericId) && numericId > 0) {
                orFilters.push({ id: numericId });
                // ORD-1077 → id 77 if display is 1000+id
                if (numericId > 1000) {
                    orFilters.push({ id: numericId - 1000 });
                }
            }

            listWhere.OR = orFilters;
        }

        const orders = await prisma.order.findMany({
            where: listWhere,
            include: orderDetailInclude,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            summary: {
                ordersCount,
                revenue,
                averageCheck,
                anonymousCount,
            },
            orders: orders.map((order) => ({
                ...order,
                positionsCount: getPositionsCount(order),
                displayNumber: `ORD-${1000 + order.id}`,
            })),
        });
    } catch (error: any) {
        console.error('Ошибка при получении заказов:', error);
        res.status(400).json({ error: error.message || 'Внутренняя ошибка сервера' });
    }
});

// GET /api/orders/:id — детали заказа
router.get('/:id', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ error: 'Некорректный id заказа' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: orderDetailInclude,
        });

        if (!order) {
            res.status(404).json({ error: 'Заказ не найден' });
            return;
        }

        res.json({
            ...order,
            positionsCount: getPositionsCount(order),
            displayNumber: `ORD-${1000 + order.id}`,
        });
    } catch (error) {
        console.error('Ошибка при получении заказа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// DELETE /api/orders/:id — отмена: возврат на склад + удаление заказа
router.delete('/:id', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ error: 'Некорректный id заказа' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    items: true,
                    bouquets: {
                        include: {
                            bouquetTemplate: {
                                include: {
                                    ingredients: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }

            // Возврат поштучных позиций
            for (const orderItem of order.items) {
                await tx.item.update({
                    where: { id: orderItem.itemId },
                    data: { quantity: { increment: orderItem.quantity } },
                });
            }

            // Возврат ингредиентов букетов (по текущему рецепту шаблона — как при списании)
            for (const orderBouquet of order.bouquets) {
                const ingredients = orderBouquet.bouquetTemplate?.ingredients ?? [];

                for (const ingredient of ingredients) {
                    const restoreQty = ingredient.quantity * orderBouquet.quantity;
                    await tx.item.update({
                        where: { id: ingredient.itemId },
                        data: { quantity: { increment: restoreQty } },
                    });
                }
            }

            // Откат счётчика заказов клиента (для лояльности)
            if (order.clientId) {
                const client = await tx.client.findUnique({
                    where: { id: order.clientId },
                    select: { ordersCount: true },
                });

                if (client) {
                    await tx.client.update({
                        where: { id: order.clientId },
                        data: {
                            ordersCount: Math.max(0, client.ordersCount - 1),
                        },
                    });
                }
            }

            await tx.orderItem.deleteMany({ where: { orderId: id } });
            await tx.orderBouquet.deleteMany({ where: { orderId: id } });
            await tx.order.delete({ where: { id } });
        }, {
            maxWait: 5000,
            timeout: 10000,
        });

        res.json({ message: 'Заказ отменён, склад обновлён' });
    } catch (error: any) {
        if (error?.message === 'ORDER_NOT_FOUND') {
            res.status(404).json({ error: 'Заказ не найден' });
            return;
        }

        console.error('Ошибка при отмене заказа:', error);
        res.status(400).json({ error: error.message || 'Не удалось отменить заказ' });
    }
});

// Заказы оформляют обе рабочие роли: и администратор, и флорист.
router.post('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, name, source, items = [], bouquets = [], event } = req.body;
        const manualDiscountPercent = parseDiscountPercent(req.body.discountPercent);

        const result = await prisma.$transaction(async (tx) => {
            let resolvedClientId: number | null = null;
            let isBonusOrder = false;
            let loyaltyDiscountAmount = 0;

            if (phone) {
                const client = await tx.client.upsert({
                    where: { phone: String(phone) },
                    update: {
                        ordersCount: { increment: 1 },
                        name: name ? String(name) : undefined
                    },
                    create: {
                        phone: String(phone),
                        ordersCount: 1,
                        name: name ? String(name) : null
                    }
                });
                resolvedClientId = client.id;

                // НОВОЕ: Если переданы данные события, сохраняем его в привязке к клиенту
                if (event && event.title && event.date) {
                    await tx.clientEvent.create({
                        data: {
                            title: String(event.title),
                            date: new Date(event.date), // Prisma сама распарсит строку в DateTime
                            clientId: resolvedClientId
                        }
                    });
                }

                if (client.ordersCount > 0 && client.ordersCount % 7 === 0) {
                    isBonusOrder = true;
                    const lastOrders = await tx.order.findMany({
                        where: { clientId: resolvedClientId },
                        orderBy: { createdAt: 'desc' },
                        take: 6
                    });
                    const sumOfLastOrders = lastOrders.reduce((sum, order) => sum + order.totalPrice, 0);
                    loyaltyDiscountAmount = sumOfLastOrders / 6;
                }
            }

            let calculatedTotalPrice = 0;
            const orderItemsData = [];
            const orderBouquetsData = [];

            // обработка ПОШТУЧНЫХ товаров
            for (const reqItem of items) {
                const item = await tx.item.findUnique({ where: { id: reqItem.itemId } });

                if (!item) {
                    throw new Error(`Товар с ID ${reqItem.itemId} не найден на складе`);
                }
                if (item.quantity < reqItem.quantity) {
                    throw new Error(`Не хватает товара: ${item.name}. Остаток: ${item.quantity}, запрошено: ${reqItem.quantity}`);
                }

                calculatedTotalPrice += item.price * reqItem.quantity;

                orderItemsData.push({
                    itemId: item.id,
                    quantity: reqItem.quantity,
                    priceAtSale: item.price
                });

                await tx.item.update({
                    where: { id: item.id },
                    data: { quantity: { decrement: reqItem.quantity } }
                });
            }

            // обработка ГОТОВЫХ БУКЕТОВ (распаковка рецептов)
            for (const reqBouquet of bouquets) {
                const template = await tx.bouquetTemplate.findUnique({
                    where: { id: reqBouquet.bouquetTemplateId },
                    include: { ingredients: true }
                });

                if (!template) {
                    throw new Error(`Шаблон букета с ID ${reqBouquet.bouquetTemplateId} не найден`);
                }

                calculatedTotalPrice += template.price * reqBouquet.quantity;

                orderBouquetsData.push({
                    bouquetTemplateId: template.id,
                    quantity: reqBouquet.quantity,
                    priceAtSale: template.price
                });

                for (const ingredient of template.ingredients) {
                    const requiredQty = ingredient.quantity * reqBouquet.quantity;
                    const item = await tx.item.findUnique({ where: { id: ingredient.itemId } });

                    if (!item) {
                        throw new Error(`Ингредиент с ID ${ingredient.itemId} не найден`);
                    }
                    if (item.quantity < requiredQty) {
                        throw new Error(`Не хватает сырья для букета: ${item.name}`);
                    }

                    await tx.item.update({
                        where: { id: item.id },
                        data: { quantity: { decrement: requiredQty } }
                    });
                }
            }

            // 1) ручная %‑скидка, 2) лояльность 7-го заказа
            let manualDiscountAmount = 0;

            if (manualDiscountPercent !== null) {
                manualDiscountAmount = Math.round((calculatedTotalPrice * manualDiscountPercent) / 100);
                calculatedTotalPrice = Math.max(0, calculatedTotalPrice - manualDiscountAmount);
            }

            if (isBonusOrder) {
                calculatedTotalPrice = Math.max(0, calculatedTotalPrice - loyaltyDiscountAmount);
            }

            const newOrder = await tx.order.create({
                data: {
                    totalPrice: Math.round(calculatedTotalPrice),
                    source: String(source),
                    clientId: resolvedClientId,
                    createdById: req.user?.id ?? null,
                    discountPercent: manualDiscountPercent,
                    discountAmount: manualDiscountAmount,
                    items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
                    bouquets: orderBouquetsData.length > 0 ? { create: orderBouquetsData } : undefined
                },
                include: orderDetailInclude,
            });

            return {
                ...newOrder,
                isBonusOrder,
                loyaltyDiscountAmount: isBonusOrder ? Math.round(loyaltyDiscountAmount) : 0,
                manualDiscountAmount,
            };
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        let message = 'Заказ успешно оформлен';

        if (result.isBonusOrder && result.manualDiscountAmount > 0) {
            message = 'Применены скидка по % и бонус за 7-й заказ!';
        } else if (result.isBonusOrder) {
            message = 'Применена скидка за 7-й заказ!';
        } else if (result.manualDiscountAmount > 0) {
            message = `Применена скидка ${result.discountPercent}%`;
        }

        res.status(201).json({
            message,
            order: result
        });

    } catch (error: any) {
        console.error('Ошибка при создании заказа:', error);
        res.status(400).json({ error: error.message || 'Внутренняя ошибка сервера' });
    }
});

export default router;
