export type UserRole = 'ADMIN' | 'FLORIST';
export type NavigationIcon = 'pos' | 'clients' | 'bouquets' | 'inventory' | 'analytics';
export type InventoryCategory = 'FLOWER' | 'PACKAGING' | 'ACCESSORY' | 'SERVICE';
export type BouquetFilter = 'Все' | 'Цветы' | 'Упаковка' | 'Аксессуары';

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

export interface InventoryItem {
  id: number;
  name: string;
  category: InventoryCategory;
  imageUrl: string | null;
  quantity: number;
  costPrice: number;
  price: number;
  isActive: boolean;
}

export type CreatedInventoryItem = InventoryItem;

export interface BouquetIngredientDraft {
  itemId: number;
  quantity: number;
  item: InventoryItem;
}

export interface BouquetPreviewData {
  name: string;
  imageUrl: string | null;
  ingredients: BouquetIngredientDraft[];
}

export interface BouquetTemplateResponse {
  message: string;
  template: {
    id: number;
    name: string;
    imageUrl: string | null;
    price: number;
  };
}
