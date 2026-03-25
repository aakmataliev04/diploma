import { Router, Request, Response } from 'express';
import  prisma  from '../db';
import { verifyToken } from '../middlewares/authMiddleware';

// расширяем тип Request, если есть AuthRequest
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

const router = Router();


router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, source, items } = req.body;

        // запускаем транзакцию
        const result = await prisma.$transaction(async (tx) => {
            let resolvedClientId: number | null = null;
            let isBonusOrder = false;
            let discountAmount = 0; // сумма нашей скидки

            // ищем или создаем клиента
            if (phone) {
                const client = await tx.client.upsert({
                    where: { phone: String(phone) },
                    update: { ordersCount: { increment: 1 } },
                    create: { phone: String(phone), ordersCount: 1 }
                });
                resolvedClientId = client.id;

                // смена условий акции, то замена числа в условии и замена числа в take
                if (client.ordersCount > 0 && client.ordersCount % 7 === 0) {
                    isBonusOrder = true;

                    // вытаскиваем последние 6 заказов этого клиента
                    const lastOrders = await tx.order.findMany({
                        where: { clientId: resolvedClientId },
                        orderBy: { createdAt: 'desc' }, // Сортируем от новых к старым
                        take: 6 // Берем ровно 6 штук
                    });

                    // сумма 6 заказов
                    const sumOfLastOrders = lastOrders.reduce((sum, order) => sum + order.totalPrice, 0);

                    // среднее арифметическое
                    discountAmount = sumOfLastOrders / 6;
                }
            }

            let calculatedTotalPrice = 0;
            const orderItemsData = [];

            // проверяем наличие товаров на складе
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

                //  списываем товар со склада
                await tx.item.update({
                    where: { id: item.id },
                    data: { quantity: { decrement: reqItem.quantity } }
                });
            }

            // минусуем среднюю стоимость, Math.max, чтобы цена не ушла в минус, если букет дешевле
            if (isBonusOrder) {
                calculatedTotalPrice = Math.max(0, calculatedTotalPrice - discountAmount);
            }

            // создаем заказ в базе
            const newOrder = await tx.order.create({
                data: {
                    totalPrice: calculatedTotalPrice,
                    source: String(source),
                    clientId: resolvedClientId,
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            return {
                ...newOrder,
                isBonusOrder,
                discountAmount: isBonusOrder ? discountAmount : 0
            };
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