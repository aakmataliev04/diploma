import type { NavigationItem, UserRole } from '../types';

export const defaultRouteByRole: Record<UserRole, string> = {
  ADMIN: '/admin/pos',
  FLORIST: '/florist/pos',
};

export const appNavigation: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    { icon: 'pos', label: 'POS-терминал', to: '/admin/pos' },
    { icon: 'clients', label: 'Клиентская база', to: '/admin/clients' },
    { icon: 'bouquets', label: 'Конструктор букетов', to: '/admin/bouquets' },
    { icon: 'inventory', label: 'Склад', to: '/admin/inventory' },
    { icon: 'analytics', label: 'Аналитика', to: '/admin/analytics' },
  ],
  FLORIST: [
    { icon: 'pos', label: 'POS-терминал', to: '/florist/pos' },
    { icon: 'clients', label: 'Поиск клиентов', to: '/florist/client-search' },
    { icon: 'bouquets', label: 'Конструктор букетов', to: '/florist/bouquets' },
    { icon: 'inventory', label: 'Склад', to: '/florist/inventory' },
  ],
};
