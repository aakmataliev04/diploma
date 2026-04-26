import { useDeferredValue, useEffect, useState } from 'react';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import type { BouquetTemplate, CreatedInventoryItem, InventoryItem } from '../../types';
import InventoryBouquetModal from './components/InventoryBouquetModal/InventoryBouquetModal';
import InventoryModal from './components/InventoryModal/InventoryModal';
import InventoryRestockModal from './components/InventoryRestockModal/InventoryRestockModal';
import {
  EditIcon,
  InventoryFallbackIcon,
  InventoryCostIcon,
  LowStockIcon,
  SearchIcon,
  TotalItemsIcon,
  WarningIcon,
} from './components/InventoryIcons/InventoryIcons';
import './Inventory.css';

type InventoryFilter = 'Все' | 'Букеты' | 'Цветы' | 'Упаковка' | 'Аксессуары' | 'Услуги';

const inventoryStats = [
  {
    title: 'Всего позиций',
    valueKey: 'total',
    iconClassName: 'inventory-info-card-icon inventory-info-card-icon-total',
    Icon: TotalItemsIcon,
  },
  {
    title: 'Низкий остаток',
    valueKey: 'low',
    iconClassName: 'inventory-info-card-icon inventory-info-card-icon-low',
    Icon: LowStockIcon,
  },
  {
    title: 'Стоимость склада',
    valueKey: 'cost',
    iconClassName: 'inventory-info-card-icon inventory-info-card-icon-cost',
    Icon: InventoryCostIcon,
    adminOnly: true,
  },
];

const inventoryFilters: InventoryFilter[] = ['Все', 'Букеты', 'Цветы', 'Упаковка', 'Аксессуары', 'Услуги'];
const lowStockThreshold = 20;
const maxProgressQuantity = 100;

const categoryLabelByCode: Record<string, string> = {
  FLOWER: 'ЦВЕТЫ',
  PACKAGING: 'УПАКОВКА',
  ACCESSORY: 'АКСЕССУАРЫ',
  SERVICE: 'УСЛУГИ',
};

const categoryFilterByCode: Record<string, InventoryFilter> = {
  FLOWER: 'Цветы',
  PACKAGING: 'Упаковка',
  ACCESSORY: 'Аксессуары',
  SERVICE: 'Услуги',
};

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const getBouquetIngredientsSummary = (template: BouquetTemplate) =>
  template.ingredients
    .map((ingredient) => `${ingredient.item.name}${ingredient.quantity > 1 ? ` ${ingredient.quantity}шт` : ''}`)
    .join(', ');

const getBouquetCost = (template: BouquetTemplate) =>
  template.ingredients.reduce((total, ingredient) => total + ingredient.quantity * ingredient.item.costPrice, 0);

const getProgressPercent = (quantity: number) => {
  const percent = (quantity / maxProgressQuantity) * 100;
  return Math.max(8, Math.min(100, percent));
};

const Inventory = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [bouquetTemplates, setBouquetTemplates] = useState<BouquetTemplate[]>([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isBouquetModalOpen, setIsBouquetModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedBouquetTemplate, setSelectedBouquetTemplate] = useState<BouquetTemplate | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<InventoryFilter>('Все');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [templatesErrorMessage, setTemplatesErrorMessage] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    if (!session) {
      return;
    }

    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setTemplatesErrorMessage('');

        const [itemsResponse, templatesResponse] = await Promise.allSettled([
          axiosApi.get<InventoryItem[]>('/inventory'),
          axiosApi.get<BouquetTemplate[]>('/inventory/templates'),
        ]);

        if (itemsResponse.status === 'fulfilled') {
          setItems(itemsResponse.value.data);
        } else {
          setItems([]);
          setErrorMessage('Не удалось загрузить склад. Проверь подключение к серверу.');
        }

        if (templatesResponse.status === 'fulfilled') {
          setBouquetTemplates(templatesResponse.value.data);
        } else {
          setBouquetTemplates([]);
          setTemplatesErrorMessage('Не удалось загрузить шаблоны букетов.');
        }
      } catch {
        setErrorMessage('Не удалось загрузить склад. Проверь подключение к серверу.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInventory();
  }, [session]);

  const normalizedSearch = deferredSearchValue.trim().toLowerCase();
  const lowStockItems = items.filter((item) => item.quantity < lowStockThreshold);
  const visibleStats = inventoryStats.filter((stat) => !stat.adminOnly || session?.user.role === 'ADMIN');
  const filteredItems = items.filter((item) => {
    const filterMatches =
      selectedFilter === 'Все' || categoryFilterByCode[item.category] === selectedFilter;

    const searchMatches = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);

    return filterMatches && searchMatches;
  });
  const filteredBouquetTemplates = bouquetTemplates.filter((template) => {
    if (selectedFilter !== 'Букеты') {
      return false;
    }

    return !normalizedSearch || template.name.toLowerCase().includes(normalizedSearch);
  });

  const totalInventoryCost = items.reduce((total, item) => total + item.quantity * item.costPrice, 0);
  const statsValueByKey = {
    total: `${items.length}`,
    low: `${lowStockItems.length}`,
    cost: `${formatNumber(totalInventoryCost)} сом`,
  };

  const handleSavedItem = (savedItem: CreatedInventoryItem) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === savedItem.id);

      if (existingItemIndex === -1) {
        return [savedItem, ...prevItems];
      }

      return prevItems.map((item) => (item.id === savedItem.id ? savedItem : item));
    });
  };

  const handleDeletedItem = (itemId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleSavedBouquetTemplate = (savedTemplate: BouquetTemplate) => {
    setBouquetTemplates((prevTemplates) =>
      prevTemplates.map((template) => (template.id === savedTemplate.id ? savedTemplate : template)),
    );
  };

  const handleDeletedBouquetTemplate = (templateId: number) => {
    setBouquetTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== templateId));
  };

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setIsInventoryModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsInventoryModalOpen(true);
  };

  const handleOpenBouquetEditModal = (template: BouquetTemplate) => {
    setSelectedBouquetTemplate(template);
    setIsBouquetModalOpen(true);
  };

  const handleOpenRestockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsRestockModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsInventoryModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseBouquetModal = () => {
    setIsBouquetModalOpen(false);
    setSelectedBouquetTemplate(null);
  };

  const handleCloseRestockModal = () => {
    setIsRestockModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <section className="inventory-container">
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={handleCloseModal}
        onSaved={handleSavedItem}
        onDeleted={handleDeletedItem}
        itemToEdit={selectedItem}
      />
      <InventoryBouquetModal
        isOpen={isBouquetModalOpen}
        onClose={handleCloseBouquetModal}
        onSaved={handleSavedBouquetTemplate}
        onDeleted={handleDeletedBouquetTemplate}
        templateToEdit={selectedBouquetTemplate}
        canDelete={session?.user.role === 'ADMIN'}
      />
      <InventoryRestockModal
        isOpen={isRestockModalOpen}
        onClose={handleCloseRestockModal}
        onUpdated={handleSavedItem}
        itemToRestock={selectedItem}
      />

      <div className="inventory-state">
        <div className="inventory-top">
          <div className="inventory-heading">
            <h1 className="page-title">Управление складом</h1>
            <p className="page-subtitle">Контроль остатков и пополнение товаров</p>
          </div>

          <button type="button" className="inventory-add-button" onClick={handleOpenCreateModal}>
            <span className="inventory-add-button-plus">+</span>
            <span>Добавить товар</span>
          </button>
        </div>

        <div className="inventory-info">
          {visibleStats.map(({ title, valueKey, iconClassName, Icon }) => (
            <article key={title} className="inventory-info-card">
              <div className={iconClassName}>
                <Icon className="inventory-info-card-svg" />
              </div>
              <div className="inventory-info-card-content">
                <p className="inventory-info-card-title inventory-info-card-tittle">{title}</p>
                <p className="inventory-info-card-text">{statsValueByKey[valueKey as keyof typeof statsValueByKey]}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="inventory-warning">
          <div className="inventory-warning-title">
            <WarningIcon className="inventory-warning-icon" />
            <span>Требуется пополнение</span>
          </div>
          <div className="inventory-warning-tags">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <span key={item.id} className="inventory-warning-tag">
                  <span>{item.name}</span>
                  <span className="inventory-warning-tag-accent">{item.quantity} шт ост.</span>
                </span>
              ))
            ) : (
              <span className="inventory-warning-tag">Критически низких остатков нет</span>
            )}
          </div>
        </div>
      </div>

      <div className="inventory-list">
        <div className="inventory-search-row">
          <div className="inventory-search-panel">
            <label className="inventory-search">
              <SearchIcon className="inventory-search-icon" />
              <input
                className="inventory-search-input"
                type="text"
                placeholder="Поиск по названию или артикулу..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>

            <div className="inventory-filters">
              {inventoryFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={
                    selectedFilter === filter
                      ? 'inventory-filter-button inventory-filter-button-active'
                      : 'inventory-filter-button'
                  }
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="inventory-list-grid">
          {isLoading ? <div className="inventory-list-placeholder">Загружаем склад...</div> : null}

          {!isLoading && errorMessage ? <div className="inventory-list-placeholder">{errorMessage}</div> : null}

          {!isLoading && !errorMessage && selectedFilter !== 'Букеты' && filteredItems.length === 0 ? (
            <div className="inventory-list-placeholder">По текущему фильтру товары не найдены.</div>
          ) : null}

          {!isLoading && selectedFilter === 'Букеты' && templatesErrorMessage ? (
            <div className="inventory-list-placeholder">{templatesErrorMessage}</div>
          ) : null}

          {!isLoading && !templatesErrorMessage && selectedFilter === 'Букеты' && filteredBouquetTemplates.length === 0 ? (
            <div className="inventory-list-placeholder">По текущему фильтру шаблоны букетов не найдены.</div>
          ) : null}

          {!isLoading && !errorMessage && selectedFilter !== 'Букеты'
            ? filteredItems.map((item) => {
                const isLowStock = item.quantity < lowStockThreshold;

                return (
                  <article
                    key={item.id}
                    className={isLowStock ? 'inventory-card inventory-card-low' : 'inventory-card'}
                  >
              <div className="inventory-card-head">
                <div className="inventory-card-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="inventory-card-image-photo" />
                  ) : (
                    <InventoryFallbackIcon className="inventory-card-image-icon" />
                  )}
                </div>

                <div className="inventory-card-main">
                  <div className="inventory-card-title-row">
                    <h3 className="inventory-card-title inventory-card-tittle">{item.name}</h3>
                    {isLowStock ? <WarningIcon className="inventory-card-warning-icon" /> : null}
                  </div>
                  <span className="inventory-card-categoryTittle">{categoryLabelByCode[item.category] ?? item.category}</span>
                </div>
              </div>

              <div className="inventory-card-stock">
                <span className="inventory-card-stock-label">Остаток:</span>
                <span className="inventory-card-stock-value">{item.quantity} шт</span>
              </div>
              <div className="inventory-card-progress">
                <div
                  className={isLowStock ? 'inventory-card-progress-bar inventory-card-progress-bar-low' : 'inventory-card-progress-bar'}
                  style={{ width: `${getProgressPercent(item.quantity)}%` }}
                />
              </div>

              <div className="inventory-card-summary">
                <div className="inventory-card-summary-item">
                  <span className="inventory-card-summary-label">СЕБЕСТОИМОСТЬ</span>
                  <span className="inventory-card-summary-value">{formatNumber(item.costPrice)} сом</span>
                </div>
                <div className="inventory-card-summary-item">
                  <span className="inventory-card-summary-label">ЦЕНА ПРОДАЖИ</span>
                  <span className="inventory-card-summary-value inventory-card-summary-value-sale">
                    {formatNumber(item.price)} сом
                  </span>
                </div>
              </div>

              <div className="inventory-card-actions">
                <button type="button" className="inventory-addQuatity" onClick={() => handleOpenRestockModal(item)}>
                  + Пополнить
                </button>

                <button
                  type="button"
                  className="inventory-edit-button"
                  aria-label={`Изменить ${item.name}`}
                  onClick={() => handleOpenEditModal(item)}
                >
                  <EditIcon className="inventory-edit-button-icon" />
                </button>
              </div>
            </article>
                );
              })
            : null}

          {!isLoading && !templatesErrorMessage && selectedFilter === 'Букеты'
            ? filteredBouquetTemplates.map((template) => {
                const bouquetCost = getBouquetCost(template);
                const ingredientsSummary = getBouquetIngredientsSummary(template);

                return (
                  <article key={template.id} className="inventory-bouquets-card">
                    <div className="inventory-bouquets-card-head">
                      <div className="inventory-bouquets-card-image">
                        {template.imageUrl ? (
                          <img src={template.imageUrl} alt={template.name} className="inventory-bouquets-card-image-photo" />
                        ) : (
                          <InventoryFallbackIcon className="inventory-bouquets-card-image-icon" />
                        )}
                      </div>

                      <div className="inventory-bouquets-card-main">
                        <h3 className="inventory-bouquets-card-tittle">{template.name}</h3>
                        <span className="inventory-bouquets-card-category">ШАБЛОН БУКЕТА</span>
                      </div>
                    </div>

                    <div className="inventory-bouquets-card-composition">
                      <span className="inventory-bouquets-card-composition-label">Состав:</span>
                      <p className="inventory-bouquets-card-composition-text">{ingredientsSummary}</p>
                    </div>

                    <div className="inventory-bouquets-card-summary">
                      <div className="inventory-bouquets-card-summary-item">
                        <span className="inventory-bouquets-card-summary-label">СЕБЕСТОИМОСТЬ</span>
                        <span className="inventory-bouquets-card-summary-value">{formatNumber(bouquetCost)} сом</span>
                      </div>
                      <div className="inventory-bouquets-card-summary-item">
                        <span className="inventory-bouquets-card-summary-label">ЦЕНА ПРОДАЖИ</span>
                        <span className="inventory-bouquets-card-summary-value inventory-bouquets-card-summary-value-sale">
                          {formatNumber(template.price)} сом
                        </span>
                      </div>
                    </div>

                    <div className="inventory-bouquets-card-actions">
                      <button
                        type="button"
                        className="inventory-bouquets-card-edit-button"
                        aria-label={`Изменить шаблон ${template.name}`}
                        onClick={() => handleOpenBouquetEditModal(template)}
                      >
                        <EditIcon className="inventory-bouquets-card-edit-icon" />
                        Редактировать
                      </button>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      </div>
    </section>
  );
};

export default Inventory;
