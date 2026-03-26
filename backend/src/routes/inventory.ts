import { Router, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// ОБЫЧНЫЕ ТОВАРЫ (РОЗЫ, ЛЕНТЫ И Т.Д.)

// Добавление товара на склад
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, category, quantity, price, costPrice } = req.body;

        if (!name || !category || quantity === undefined || price === undefined || costPrice === undefined) {
            res.status(400).json({ error: 'Заполните все поля: name, category, quantity, price, costPrice' });
            return;
        }

        const newItem = await prisma.item.create({
            data: {
                name: String(name),
                category: String(category),
                quantity: Number(quantity),
                price: Number(price),
                costPrice: Number(costPrice) // Сохраняем закупку
            }
        });

        res.status(201).json({ message: 'Товар успешно добавлен', item: newItem });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера при добавлении товара' });
    }
});

// Список всех товаров
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const items = await prisma.item.findMany({ orderBy: { id: 'desc' } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Изменение товара
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, category, quantity, price, costPrice } = req.body;

        const existingItem = await prisma.item.findUnique({ where: { id: Number(id) } });
        if (!existingItem) {
            res.status(404).json({ error: 'Товар не найден' });
            return;
        }

        const updatedItem = await prisma.item.update({
            where: { id: Number(id) },
            data: {
                name: name !== undefined ? String(name) : existingItem.name,
                category: category !== undefined ? String(category) : existingItem.category,
                quantity: quantity !== undefined ? Number(quantity) : existingItem.quantity,
                price: price !== undefined ? Number(price) : existingItem.price,
                costPrice: costPrice !== undefined ? Number(costPrice) : existingItem.costPrice,
            }
        });

        res.json({ message: 'Данные обновлены', item: updatedItem });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении' });
    }
});

// Пополнение склада (PATCH)
router.patch('/:id/add-stock', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { addedQuantity } = req.body;

        const updatedItem = await prisma.item.update({
            where: { id: Number(id) },
            data: { quantity: { increment: Number(addedQuantity) } }
        });

        res.json({ message: 'Склад пополнен', item: updatedItem });
    } catch (error) {
        res.status(400).json({ error: 'Ошибка при пополнении' });
    }
});

// Удаление товара
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.item.delete({ where: { id: Number(id) } });
        res.json({ message: 'Товар удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении' });
    }
});


// ШАБЛОНЫ БУКЕТОВ

// Создать шаблон букета (рецепт)
router.post('/templates', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, price, ingredients } = req.body;
        // Ожидаем ingredients: [{ itemId: 1, quantity: 5 }]

        if (!name || !price || !ingredients || !Array.isArray(ingredients)) {
            res.status(400).json({ error: 'Укажите название, цену и массив ингредиентов' });
            return;
        }

        const newTemplate = await prisma.bouquetTemplate.create({
            data: {
                name: String(name),
                price: Number(price),
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        itemId: Number(ing.itemId),
                        quantity: Number(ing.quantity)
                    }))
                }
            },
            include: { ingredients: true }
        });

        res.status(201).json({ message: 'Шаблон букета создан', template: newTemplate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании шаблона' });
    }
});

// Получить все шаблоны букетов с их составом
router.get('/templates', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const templates = await prisma.bouquetTemplate.findMany({
            include: {
                ingredients: {
                    include: { item: true } // Видим, какие именно цветы в составе
                }
            }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении шаблонов' });
    }
});

export default router;