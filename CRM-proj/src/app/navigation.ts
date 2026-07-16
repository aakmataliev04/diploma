import type { NavigationItem, UserRole } from '../types';

export const defaultRouteByRole: Record<UserRole, string> = {
  ADMIN: '/admin/pos',
  FLORIST: '/florist/pos',
};

export const appNavigation: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    { icon: 'pos', label: 'POS-терминал', to: '/admin/pos' },
    { icon: 'orders', label: 'Заказы', to: '/admin/orders' },
    { icon: 'clients', label: 'Клиентская база', to: '/admin/clients' },
    { icon: 'bouquets', label: 'Конструктор букетов', to: '/admin/bouquets' },
    { icon: 'inventory', label: 'Склад', to: '/admin/inventory' },
    { icon: 'analytics', label: 'Аналитика', to: '/admin/analytics' },
  ],
  FLORIST: [
    { icon: 'pos', label: 'POS-терминал', to: '/florist/pos' },
    { icon: 'orders', label: 'Заказы', to: '/florist/orders' },
    { icon: 'clients', label: 'Клиентская база', to: '/florist/clients' },
    { icon: 'bouquets', label: 'Конструктор букетов', to: '/florist/bouquets' },
    { icon: 'inventory', label: 'Склад', to: '/florist/inventory' },
  ],
};
