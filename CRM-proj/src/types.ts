export type UserRole = 'ADMIN' | 'FLORIST';
export type NavigationIcon = 'pos' | 'clients' | 'bouquets' | 'inventory' | 'analytics';
export type InventoryCategory = 'FLOWER' | 'PACKAGING' | 'ACCESSORY' | 'SERVICE';
export type BouquetFilter = 'Все' | 'Цветы' | 'Упаковка' | 'Аксессуары';
export type PosCatalogFilter = 'Все' | 'Букеты' | 'Цветы' | 'Упаковка' | 'Аксессуары' | 'Услуги';
export type PosOrderSource = 'С улицы' | 'WhatsApp' | 'Instagram' | '2 GIS';
export type PosCatalogEntryType = 'bouquet' | 'item';

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

export interface BouquetTemplateIngredient {
  id: number;
  bouquetTemplateId: number;
  itemId: number;
  quantity: number;
  item: InventoryItem;
}

export interface BouquetTemplate {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
  ingredients: BouquetTemplateIngredient[];
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

export interface PosCatalogEntry {
  id: string;
  entityId: number;
  type: PosCatalogEntryType;
  name: string;
  imageUrl: string | null;
  price: number;
  filter: PosCatalogFilter;
}

export interface PosBasketItem {
  id: string;
  entityId: number;
  type: PosCatalogEntryType;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderResponse {
  message: string;
  order: {
    id: number;
    totalPrice: number;
  };
}
