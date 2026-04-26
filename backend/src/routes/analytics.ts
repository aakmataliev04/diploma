import { Router, Response } from 'express';
import prisma from '../db';
import { verifyToken, AuthRequest, requireRole } from '../middlewares/authMiddleware';

type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';
type ChartGranularity = 'hour' | 'day' | 'month';

interface PeriodRange {
    start: Date;
    end: Date;
    previousStart: Date;
    previousEnd: Date;
}

const router = Router();

const sourceMeta: Record<string, { label: string; color: string; icon: string }> = {
    'WhatsApp': { label: 'WhatsApp', color: '#25D366', icon: 'WA' },
    'Instagram': { label: 'Instagram', color: '#E1306C', icon: 'IG' },
    'С улицы': { label: 'С улицы', color: '#4A90E2', icon: 'IN' },
    'Telegram': { label: 'Telegram', color: '#2AABEE', icon: 'TG' },
    '2 GIS': { label: '2GIS', color: '#00A550', icon: '2G' },
};

const flowerColors = ['#FF6B9D', '#D4A5D9', '#B794F4', '#FF8B85', '#4A7C5E', '#8E7CC3', '#E1306C'];

const fallbackSources = ['WhatsApp', 'Instagram', 'С улицы', 'Telegram', '2 GIS'];

const startOfDay = (date: Date) => {
    const nextDate = new Date(date);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
};

const addDays = (date: Date, days: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
};

const addMonths = (date: Date, months: number) => {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);
    return nextDate;
};

const addYears = (date: Date, years: number) => {
    const nextDate = new Date(date);
    nextDate.setFullYear(nextDate.getFullYear() + years);
    return nextDate;
};

const normalizePeriod = (value: unknown): AnalyticsPeriod => {
    if (value === 'today' || value === 'week' || value === 'month' || value === 'year' || value === 'custom') {
        return value;
    }

    return 'month';
};

const parseDateInput = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const parsedDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

const getCustomPeriodRange = (startDateValue: unknown, endDateValue: unknown): PeriodRange | null => {
    const start = parseDateInput(startDateValue);
    const endStart = parseDateInput(endDateValue);

    if (!start || !endStart || start > endStart) {
        return null;
    }

    const end = addDays(endStart, 1);
    const durationMs = end.getTime() - start.getTime();
    const previousEnd = start;
    const previousStart = new Date(start.getTime() - durationMs);

    return {
        start,
        end,
        previousStart,
        previousEnd,
    };
};

const getPeriodRange = (period: AnalyticsPeriod, startDate?: unknown, endDate?: unknown): PeriodRange | null => {
    if (period === 'custom') {
        return getCustomPeriodRange(startDate, endDate);
    }

    const now = new Date();
    const todayStart = startOfDay(now);

    if (period === 'today') {
        const end = addDays(todayStart, 1);
        return {
            start: todayStart,
            end,
            previousStart: addDays(todayStart, -1),
            previousEnd: todayStart,
        };
    }

    if (period === 'week') {
        const start = addDays(todayStart, -6);
        const end = addDays(todayStart, 1);
        return {
            start,
            end,
            previousStart: addDays(start, -7),
            previousEnd: start,
        };
    }

    if (period === 'year') {
        const start = new Date(todayStart.getFullYear(), 0, 1);
        const end = addYears(start, 1);
        return {
            start,
            end,
            previousStart: addYears(start, -1),
            previousEnd: start,
        };
    }

    const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const end = addMonths(start, 1);

    return {
        start,
        end,
        previousStart: addMonths(start, -1),
        previousEnd: start,
    };
};

const getTrendPercent = (current: number, previous: number) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
};

const getOrderCost = (order: any) => {
    const itemsCost = order.items.reduce((sum: number, orderItem: any) => {
        return sum + orderItem.quantity * (orderItem.item?.costPrice ?? 0);
    }, 0);

    const bouquetsCost = order.bouquets.reduce((sum: number, orderBouquet: any) => {
        const ingredientsCost = orderBouquet.bouquetTemplate.ingredients.reduce((ingredientSum: number, ingredient: any) => {
            return ingredientSum + ingredient.quantity * (ingredient.item?.costPrice ?? 0);
        }, 0);

        return sum + ingredientsCost * orderBouquet.quantity;
    }, 0);

    return itemsCost + bouquetsCost;
};

const getOrderProfit = (order: any) => Math.max(0, order.totalPrice - getOrderCost(order));

const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getHourKey = (date: Date) => `${getDateKey(date)}-${String(date.getHours()).padStart(2, '0')}`;

const getChartGranularity = (period: AnalyticsPeriod, range: PeriodRange): ChartGranularity => {
    if (period === 'today') {
        return 'hour';
    }

    if (period === 'year') {
        return 'month';
    }

    if (period === 'custom' && range.end.getTime() - range.start.getTime() === 24 * 60 * 60 * 1000) {
        return 'hour';
    }

    return 'day';
};

const getDateLabel = (date: Date, granularity: ChartGranularity) => {
    if (granularity === 'month') {
        return date.toLocaleString('ru-RU', { month: 'short' });
    }

    if (granularity === 'hour') {
        return `${String(date.getHours()).padStart(2, '0')}:00`;
    }

    return String(date.getDate());
};

const getChartPointDate = (date: Date, granularity: ChartGranularity) => {
    if (granularity === 'hour') {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (granularity === 'month') {
        return date.toLocaleString('ru-RU', {
            month: 'long',
            year: 'numeric',
        });
    }

    return getDateKey(date);
};

router.get('/', verifyToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const period = normalizePeriod(req.query.period);
        const range = getPeriodRange(period, req.query.startDate, req.query.endDate);

        if (!range) {
            res.status(400).json({ error: 'Укажите корректный период: startDate и endDate в формате YYYY-MM-DD' });
            return;
        }

        const [orders, previousOrders, newClientsCount, previousNewClientsCount] = await Promise.all([
            prisma.order.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: range.start, lt: range.end },
                },
                include: {
                    items: { include: { item: true } },
                    bouquets: {
                        include: {
                            bouquetTemplate: {
                                include: {
                                    ingredients: { include: { item: true } },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.order.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: range.previousStart, lt: range.previousEnd },
                },
                include: {
                    items: { include: { item: true } },
                    bouquets: {
                        include: {
                            bouquetTemplate: {
                                include: {
                                    ingredients: { include: { item: true } },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.client.count({
                where: { createdAt: { gte: range.start, lt: range.end } },
            }),
            prisma.client.count({
                where: { createdAt: { gte: range.previousStart, lt: range.previousEnd } },
            }),
        ]);

        const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const profit = orders.reduce((sum, order) => sum + getOrderProfit(order), 0);
        const previousProfit = previousOrders.reduce((sum, order) => sum + getOrderProfit(order), 0);
        const ordersCount = orders.length;
        const previousOrdersCount = previousOrders.length;
        const averageCheck = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
        const previousAverageCheck = previousOrdersCount > 0 ? Math.round(previousRevenue / previousOrdersCount) : 0;
        const chartGranularity = getChartGranularity(period, range);

        const chartMap = new Map<string, { date: Date; revenue: number; profit: number; ordersCount: number }>();

        if (chartGranularity === 'month') {
            for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
                const date = new Date(range.start.getFullYear(), monthIndex, 1);
                chartMap.set(`${date.getFullYear()}-${monthIndex}`, { date, revenue: 0, profit: 0, ordersCount: 0 });
            }
        } else if (chartGranularity === 'hour') {
            const hourStart = new Date(range.start);
            hourStart.setMinutes(0, 0, 0);

            for (let hour = 0; hour < 24; hour += 1) {
                const date = new Date(hourStart);
                date.setHours(hour, 0, 0, 0);
                chartMap.set(getHourKey(date), { date, revenue: 0, profit: 0, ordersCount: 0 });
            }
        } else {
            for (let date = new Date(range.start); date < range.end; date = addDays(date, 1)) {
                chartMap.set(getDateKey(date), { date: new Date(date), revenue: 0, profit: 0, ordersCount: 0 });
            }
        }

        const bouquetMap = new Map<number, { name: string; revenue: number; amount: number }>();
        const flowerMap = new Map<number, { name: string; amount: number }>();
        const sourceMap = new Map<string, number>();

        for (const order of orders) {
            const orderProfit = getOrderProfit(order);
            const dateKey = chartGranularity === 'month'
                ? `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`
                : chartGranularity === 'hour'
                    ? getHourKey(order.createdAt)
                    : getDateKey(order.createdAt);
            const chartPoint = chartMap.get(dateKey);

            if (chartPoint) {
                chartPoint.revenue += order.totalPrice;
                chartPoint.profit += orderProfit;
                chartPoint.ordersCount += 1;
            }

            sourceMap.set(order.source, (sourceMap.get(order.source) ?? 0) + 1);

            for (const orderItem of order.items) {
                if (orderItem.item.category !== 'FLOWER') {
                    continue;
                }

                const existingFlower = flowerMap.get(orderItem.item.id) ?? { name: orderItem.item.name, amount: 0 };
                existingFlower.amount += orderItem.quantity;
                flowerMap.set(orderItem.item.id, existingFlower);
            }

            for (const orderBouquet of order.bouquets) {
                const existingBouquet = bouquetMap.get(orderBouquet.bouquetTemplateId) ?? {
                    name: orderBouquet.bouquetTemplate.name,
                    revenue: 0,
                    amount: 0,
                };

                existingBouquet.revenue += orderBouquet.priceAtSale * orderBouquet.quantity;
                existingBouquet.amount += orderBouquet.quantity;
                bouquetMap.set(orderBouquet.bouquetTemplateId, existingBouquet);

                for (const ingredient of orderBouquet.bouquetTemplate.ingredients) {
                    if (ingredient.item.category !== 'FLOWER') {
                        continue;
                    }

                    const existingFlower = flowerMap.get(ingredient.itemId) ?? { name: ingredient.item.name, amount: 0 };
                    existingFlower.amount += ingredient.quantity * orderBouquet.quantity;
                    flowerMap.set(ingredient.itemId, existingFlower);
                }
            }
        }

        const chart = Array.from(chartMap.values()).map((point) => ({
            label: getDateLabel(point.date, chartGranularity),
            date: getChartPointDate(point.date, chartGranularity),
            ordersCount: point.ordersCount,
            revenue: point.revenue,
            profit: point.profit,
        }));

        const topBouquetsRaw = Array.from(bouquetMap.values())
            .sort((first, second) => second.revenue - first.revenue)
            .slice(0, 5);
        const maxBouquetRevenue = Math.max(...topBouquetsRaw.map((bouquet) => bouquet.revenue), 0);
        const topBouquets = topBouquetsRaw.map((bouquet) => ({
            name: bouquet.name,
            revenue: bouquet.revenue,
            amount: bouquet.amount,
            progress: maxBouquetRevenue > 0 ? Math.round((bouquet.revenue / maxBouquetRevenue) * 100) : 0,
        }));

        const flowersRaw = Array.from(flowerMap.values())
            .sort((first, second) => second.amount - first.amount)
            .slice(0, 7);
        const maxFlowerAmount = Math.max(...flowersRaw.map((flower) => flower.amount), 0);
        const flowers = flowersRaw.map((flower, index) => ({
            name: flower.name,
            amount: flower.amount,
            expense: `${flower.amount} стеблей`,
            progress: maxFlowerAmount > 0 ? Math.round((flower.amount / maxFlowerAmount) * 100) : 0,
            color: flowerColors[index % flowerColors.length],
        }));

        const totalSourceOrders = Math.max(ordersCount, 1);
        const sourceKeys = Array.from(new Set([...fallbackSources, ...sourceMap.keys()]));
        const sources = sourceKeys.map((sourceKey) => {
            const count = sourceMap.get(sourceKey) ?? 0;
            const meta = sourceMeta[sourceKey] ?? {
                label: sourceKey,
                color: '#B794F4',
                icon: sourceKey.slice(0, 2).toUpperCase(),
            };

            return {
                name: meta.label,
                amount: count,
                value: Math.round((count / totalSourceOrders) * 100),
                color: meta.color,
                icon: meta.icon,
            };
        });

        res.json({
            period,
            summary: {
                revenue,
                profit,
                ordersCount,
                averageCheck,
                newClients: newClientsCount,
                trends: {
                    revenue: getTrendPercent(revenue, previousRevenue),
                    profit: getTrendPercent(profit, previousProfit),
                    ordersCount: getTrendPercent(ordersCount, previousOrdersCount),
                    averageCheck: getTrendPercent(averageCheck, previousAverageCheck),
                    newClients: getTrendPercent(newClientsCount, previousNewClientsCount),
                },
            },
            chart,
            topBouquets,
            flowers,
            sources,
        });
    } catch (error) {
        console.error('Ошибка при получении аналитики:', error);
        res.status(500).json({ error: 'Ошибка при получении аналитики' });
    }
});

export default router;
