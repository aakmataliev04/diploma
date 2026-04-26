export type UserRole = 'ADMIN' | 'FLORIST';
export type NavigationIcon = 'pos' | 'clients' | 'bouquets' | 'inventory' | 'analytics';
export type InventoryCategory = 'FLOWER' | 'PACKAGING' | 'ACCESSORY' | 'SERVICE';
export type BouquetFilter = 'Все' | 'Цветы' | 'Упаковка' | 'Аксессуары';
export type PosCatalogFilter = 'Все' | 'Букеты' | 'Цветы' | 'Упаковка' | 'Аксессуары' | 'Услуги';
export type PosOrderSource = 'С улицы' | 'WhatsApp' | 'Instagram' | 'Telegram' | '2 GIS';
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

export interface ClientsInfoCardData {
  id: string;
  title: string;
  value: number;
  tone: 'accent' | 'muted';
  icon: 'clients' | 'events-known' | 'events-missing';
}

export interface ClientEventApi {
  id: number;
  title: string;
  date: string;
  clientId: number;
}

export interface ClientApi {
  id: number;
  name: string | null;
  phone: string;
  ordersCount: number;
  events: ClientEventApi[];
  createdAt: string;
}

export interface ClientEditModalEventDraft {
  id: number | string;
  title: string;
  date: string;
}

export interface UpdateClientPayload {
  name: string | null;
  phone: string;
  events: Array<{
    title: string;
    date: string;
  }>;
}

export interface UpdateClientResponse {
  message: string;
  client: ClientApi;
}

export interface UpcomingClientEventData {
  id: number;
  name: string;
  phone: string;
  eventName: string;
  relativeDate: string;
  absoluteDate: string;
  extraCount?: number;
}

export type ClientsListView = 'cards' | 'list';
export type ClientsListFilter = 'all' | 'with-events' | 'without-events' | 'upcoming';
export type ClientsListSort = 'name' | 'orders' | 'event-date';

export interface ClientListCardEventData {
  title: string;
  dateLabel: string;
  extraCount?: number;
  hasUpcomingEvent?: boolean;
}

export interface ClientListCardData {
  id: number;
  name: string;
  phone: string;
  totalOrders: number;
  loyaltyCurrent: number;
  loyaltyTarget: number;
  event?: ClientListCardEventData | null;
}

export type AnalyticsApiPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface AnalyticsSummaryApi {
  revenue: number;
  profit: number;
  ordersCount: number;
  averageCheck: number;
  newClients: number;
  trends: {
    revenue: number;
    profit: number;
    ordersCount: number;
    averageCheck: number;
    newClients: number;
  };
}

export interface AnalyticsChartPointApi {
  label: string;
  date: string;
  ordersCount: number;
  revenue: number;
  profit: number;
}

export interface AnalyticsTopBouquetApi {
  name: string;
  revenue: number;
  amount: number;
  progress: number;
}

export interface AnalyticsFlowerApi {
  name: string;
  amount: number;
  expense: string;
  progress: number;
  color: string;
}

export interface AnalyticsSourceApi {
  name: string;
  amount: number;
  value: number;
  color: string;
  icon: string;
}

export interface AnalyticsResponse {
  period: AnalyticsApiPeriod;
  summary: AnalyticsSummaryApi;
  chart: AnalyticsChartPointApi[];
  topBouquets: AnalyticsTopBouquetApi[];
  flowers: AnalyticsFlowerApi[];
  sources: AnalyticsSourceApi[];
}
