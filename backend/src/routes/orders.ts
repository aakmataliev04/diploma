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

            // ищем или создаем клиента по номеру телефона
            if (phone) {
                const client = await tx.client.upsert({
                    where: { phone: String(phone) },
                    update: { ordersCount: { increment: 1 } },
                    create: { phone: String(phone), ordersCount: 1 }
                });
                resolvedClientId = client.id;
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

            return newOrder;
        });

        res.status(201).json({
            message: 'Заказ успешно оформлен',
            order: result
        });

    } catch (error: any) {
        console.error('Ошибка при создании заказа:', error);
        res.status(400).json({ error: error.message || 'Внутренняя ошибка сервера' });
    }
});

export default router;