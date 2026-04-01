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

// Заказы оформляют обе рабочие роли: и администратор, и флорист.
router.post('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {

        const { phone, name, source, items = [], bouquets = [], event } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            let resolvedClientId: number | null = null;
            let isBonusOrder = false;
            let discountAmount = 0;

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
                    discountAmount = sumOfLastOrders / 6;
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

            if (isBonusOrder) {
                calculatedTotalPrice = Math.max(0, calculatedTotalPrice - discountAmount);
            }

            const newOrder = await tx.order.create({
                data: {
                    totalPrice: Math.round(calculatedTotalPrice),
                    source: String(source),
                    clientId: resolvedClientId,
                    items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
                    bouquets: orderBouquetsData.length > 0 ? { create: orderBouquetsData } : undefined
                },
                include: {
                    items: true,
                    bouquets: true
                }
            });

            return {
                ...newOrder,
                isBonusOrder,
                discountAmount: isBonusOrder ? discountAmount : 0
            };
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        res.status(201).json({
            message: result.isBonusOrder ? 'Применена скидка за 7-й заказ!' : 'Заказ успешно оформлен',
            order: result
        });

    } catch (error: any) {
        console.error('Ошибка при создании заказа:', error);
        res.status(400).json({ error: error.message || 'Внутренняя ошибка сервера' });
    }
});

export default router;
