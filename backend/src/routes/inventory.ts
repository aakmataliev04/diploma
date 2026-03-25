import { Router, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// /api/inventory добавление товара на склад
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // данные из запроса
        const { name, category, quantity, price } = req.body;

        // проверяем, что ни одно поле не забыто
        if (!name || !category || quantity === undefined || price === undefined) {
            res.status(400).json({ error: 'Пожалуйста, заполните все поля: name, category, quantity, price' });
            return;
        }

        // заполняем обьект и отправляем в бд
        const newItem = await prisma.item.create({
            data: {
                name: String(name),
                category: String(category), // 'FLOWER' или 'PACKAGING'
                quantity: Number(quantity),
                price: Number(price)
            }
        });

        res.status(201).json({
            message: 'Товар успешно добавлен на склад',
            item: newItem
        });
    } catch (error) {
        console.error('Ошибка склада:', error);
        res.status(500).json({ error: 'Ошибка сервера при добавлении товара' });
    }
});


// /api/inventory запрос списка товаров со склада
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // достаем все обьекты из Item
        const items = await prisma.item.findMany({
            orderBy: { id: 'desc' } // сорт по дате добавления
        });

        res.json(items);
    } catch (error) {
        console.error('Ошибка при получении склада:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// /api/inventory/:id - изменение данных обьекта через пут реквест
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // достаем id из URL
        const { name, category, quantity, price } = req.body;

        //  проверяем, есть ли такой товар в базе
        const existingItem = await prisma.item.findUnique({
            where: { id: Number(id) }
        });

        if (!existingItem) {
            res.status(404).json({ error: 'Товар с таким ID не найден' });
            return;
        }

        // обновляем данные
        const updatedItem = await prisma.item.update({
            where: { id: Number(id) },
            data: {
                name: name !== undefined ? String(name) : existingItem.name,
                category: category !== undefined ? String(category) : existingItem.category,
                quantity: quantity !== undefined ? Number(quantity) : existingItem.quantity,
                price: price !== undefined ? Number(price) : existingItem.price,
            }
        });

        res.json({
            message: 'Данные товара успешно обновлены',
            item: updatedItem
        });
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// /api/inventory/:id/add-stock пополнении цветов
router.patch('/:id/add-stock', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { addedQuantity } = req.body;

        if (!addedQuantity || addedQuantity <= 0) {
            res.status(400).json({ error: 'Укажите корректное количество для пополнения' });
            return;
        }

        // обновляем товар, прибавляя количество
        const updatedItem = await prisma.item.update({
            where: { id: Number(id) },
            data: {
                quantity: { increment: Number(addedQuantity) }
            }
        });

        res.status(200).json({
            message: `Склад успешно пополнен. Текущий остаток: ${updatedItem.quantity}`,
            item: updatedItem
        });

    } catch (error: any) {
        console.error('Ошибка при пополнении склада:', error);
        res.status(400).json({ error: 'Не удалось пополнить склад. Проверьте ID товара.' });
    }
});

// /api/inventory/:id удаление товар со склада
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // есть ли что удалять
        const existingItem = await prisma.item.findUnique({
            where: { id: Number(id) }
        });

        if (!existingItem) {
            res.status(404).json({ error: 'Товар с таким ID не найден' });
            return;
        }

        // удаляем обьект из бд
        await prisma.item.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Товар успешно удален со склада' });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;