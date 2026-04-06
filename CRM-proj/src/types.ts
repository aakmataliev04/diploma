export type UserRole = 'ADMIN' | 'FLORIST';
export type NavigationIcon = 'pos' | 'clients' | 'bouquets' | 'inventory' | 'analytics';

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface NavigationItem {
  icon: NavigationIcon;
  label: string;
  to: string;
}
