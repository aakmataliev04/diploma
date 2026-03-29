import { Router, Request, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// ОБЫЧНЫЕ ТОВАРЫ (РОЗЫ, ЛЕНТЫ)

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
router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
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

// Архивация товара
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/templates', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
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

router.put('/templates/:id', verifyToken, async (req: Request, res: Response) => {
    const { id } = req.params;

    const { name, price, isActive, ingredients } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // обновляем данные шаблона
            await tx.bouquetTemplate.update({
                where: { id: Number(id) },
                data: {
                    name: name,
                    price: price,
                    isActive: isActive
                }
            });

            if (ingredients && Array.isArray(ingredients)) {
                // удаляем старые ингредиенты
                await tx.bouquetIngredient.deleteMany({
                    where: { bouquetTemplateId: Number(id) }
                });

                // создаем новые записи в BouquetIngredient
                if (ingredients.length > 0) {
                    await tx.bouquetIngredient.createMany({
                        data: ingredients.map((ing: { itemId: number, quantity: number }) => ({
                            bouquetTemplateId: Number(id),
                            itemId: ing.itemId,
                            quantity: ing.quantity
                        }))
                    });
                }
            }

            // возвращаем обновленный объект
            return tx.bouquetTemplate.findUnique({
                where: {id: Number(id)},
                include: {
                    ingredients: {
                        include: {item: true}
                    }
                }
            });
        });

        res.json({
            message: "Шаблон букета успешно обновлен",
            template: result
        });
    } catch (error) {
        console.error('Ошибка при обновлении шаблона:', error);
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка сервера";
        res.status(400).json({ error: errorMessage });
    }
});

// Архивация шаблона букета Soft Delete
router.delete('/templates/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
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