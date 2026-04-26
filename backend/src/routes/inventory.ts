import { Router, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// ОБЫЧНЫЕ ТОВАРЫ (РОЗЫ, ЛЕНТЫ)

// Приемкой и карточками товаров в магазине могут заниматься и админ, и флорист.
router.post('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, category, imageUrl, quantity, price, costPrice } = req.body;

        if (!name || !category || quantity === undefined || price === undefined || costPrice === undefined) {
            res.status(400).json({ error: 'Заполните все поля: name, category, quantity, price, costPrice' });
            return;
        }

        const newItem = await prisma.item.create({
            data: {
                name: String(name),
                category: String(category),
                imageUrl: imageUrl ? String(imageUrl) : null,
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

router.get('/', verifyToken, requireRole('ADMIN', 'FLORIST'), async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // В рабочем списке склада показываем только активные позиции.
        const items = await prisma.item.findMany({
            where: { isActive: true },
            orderBy: { id: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.put('/:id', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, category, imageUrl, quantity, price, costPrice } = req.body;

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
                imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl) : null) : existingItem.imageUrl,
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

router.patch('/:id/add-stock', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
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

// Архивация товара
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.item.update({
            where: { id: Number(id) },
            data: { isActive: false }
        });

        res.json({ message: 'Товар успешно перенесен в архив' });
    } catch (error) {
        console.error('Ошибка при архивации товара:', error);
        res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
});

// ШАБЛОНЫ БУКЕТОВ

// Рабочие шаблоны букетов тоже можно поддерживать с ролью флориста.
router.post('/templates', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, imageUrl, price, ingredients } = req.body;
        // Ожидаем ingredients: [{ itemId: 1, quantity: 5 }]

        if (!name || !price || !ingredients || !Array.isArray(ingredients)) {
            res.status(400).json({ error: 'Укажите название, цену и массив ингредиентов' });
            return;
        }

        const newTemplate = await prisma.bouquetTemplate.create({
            data: {
                name: String(name),
                imageUrl: imageUrl ? String(imageUrl) : null,
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

router.get('/templates', verifyToken, requireRole('ADMIN', 'FLORIST'), async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const templates = await prisma.bouquetTemplate.findMany({
            where: { isActive: true },
            include: {
                ingredients: {
                    include: { item: true }
                }
            }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении шаблонов' });
    }
});

router.put('/templates/:id', verifyToken, requireRole('ADMIN', 'FLORIST'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, imageUrl, price, isActive } = req.body;

    try {
        const existingTemplate = await prisma.bouquetTemplate.findUnique({
            where: { id: Number(id) }
        });

        if (!existingTemplate) {
            res.status(404).json({ error: 'Шаблон букета не найден' });
            return;
        }

        const updatedTemplate = await prisma.bouquetTemplate.update({
            where: { id: Number(id) },
            data: {
                name: name !== undefined ? String(name) : existingTemplate.name,
                imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl) : null) : existingTemplate.imageUrl,
                price: price !== undefined ? Number(price) : existingTemplate.price,
                isActive: isActive !== undefined ? Boolean(isActive) : existingTemplate.isActive
            },
            include: {
                ingredients: {
                    include: { item: true }
                }
            }
        });

        res.json({
            message: 'Шаблон букета успешно обновлен',
            template: updatedTemplate
        });
    } catch (error) {
        console.error('Ошибка при обновлении шаблона:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка сервера';
        res.status(400).json({ error: errorMessage });
    }
});

// Архивация шаблона букета Soft Delete
router.delete('/templates/:id', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.bouquetTemplate.update({
            where: { id: Number(id) },
            data: { isActive: false }
        });

        res.json({ message: 'Шаблон букета успешно перенесен в архив' });
    } catch (error) {
        console.error('Ошибка при архивации букета:', error);
        res.status(500).json({ error: 'Ошибка при удалении букета' });
    }
});

export default router;
