import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'ADMIN' | 'FLORIST';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: UserRole;
    };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // юзер должен прислать токен в формате "Bearer <токен>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Доступ запрещен. Отсутствует токен авторизации.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        // проверяем токен секретным ключом
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: UserRole };

        // записываем расшифрованные данные в запрос
        req.user = decoded;

        next();
    } catch (error) {
        res.status(403).json({ error: 'Недействительный или просроченный токен.' });
    }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            res.status(403).json({ error: 'Недостаточно прав для выполнения этого действия.' });
            return;
        }

        next();
    };
};
