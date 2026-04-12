import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { axiosApi } from '../../axiosApi';
import type {
  BouquetFilter,
  BouquetIngredientDraft,
  BouquetPreviewData,
  BouquetTemplateResponse,
  InventoryItem,
} from '../../types';
import {
  BouquetModalPositionIcon,
  CancelIconForBouquets,
  CatalogSparkIcon,
  EmptyBouquetIcon,
  MinusIconForBouquets,
  PlusIconForBouquets,
  PreviewIconForBouquets,
  ReceiptIconForBouquets,
  SaveIconForBouquets,
  SearchIconForBouquets,
  SmallPlusIconForBouquets,
  SummaryTrendIcon,
} from './components/BouquetsIcons/BouquetsIcons';
import BouquetsPreviewModal from './components/BouquetsPreviewModal/BouquetsPreviewModal';
import { InventoryFallbackIcon } from '../Inventory/components/InventoryIcons/InventoryIcons';
import './Bouquets.css';

const bouquetFilters: BouquetFilter[] = ['Все', 'Цветы', 'Упаковка', 'Аксессуары'];

const categoryFilterByCode: Record<string, BouquetFilter | null> = {
  FLOWER: 'Цветы',
  PACKAGING: 'Упаковка',
  ACCESSORY: 'Аксессуары',
  SERVICE: null,
};

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const Bouquets = () => {
  const [catalogItems, setCatalogItems] = useState<InventoryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<BouquetFilter>('Цветы');
  const [searchValue, setSearchValue] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateImageUrl, setTemplateImageUrl] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [ingredients, setIngredients] = useState<BouquetIngredientDraft[]>([]);
  const [ingredientInputValues, setIngredientInputValues] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState<BouquetPreviewData | null>(null);
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        setCatalogError('');
        const { data } = await axiosApi.get<InventoryItem[]>('/inventory');
        setCatalogItems(data.filter((item) => item.category !== 'SERVICE'));
      } catch {
        setCatalogError('Не удалось загрузить каталог ингредиентов.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCatalog();
  }, []);

  const normalizedSearch = deferredSearchValue.trim().toLowerCase();
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const categoryFilter = categoryFilterByCode[item.category];
      const filterMatches = selectedFilter === 'Все' || categoryFilter === selectedFilter;
      const searchMatches = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);

      return filterMatches && searchMatches;
    });
  }, [catalogItems, normalizedSearch, selectedFilter]);

  const totalUnits = ingredients.reduce((sum, ingredient) => sum + ingredient.quantity, 0);
  const totalCost = ingredients.reduce((sum, ingredient) => sum + ingredient.quantity * ingredient.item.costPrice, 0);
  const parsedSalePrice = Number(salePrice) || 0;
  const totalProfit = parsedSalePrice - totalCost;
  const marginPercent = parsedSalePrice > 0 ? Math.max(0, (totalProfit / parsedSalePrice) * 100) : 0;
  const isFormValid = templateName.trim() !== '' && parsedSalePrice > 0 && ingredients.length > 0;

  const handleAddIngredient = (item: InventoryItem) => {
    setStatusMessage('');
    setFormError('');
    setIngredients((prevIngredients) => {
      const existingIngredient = prevIngredients.find((ingredient) => ingredient.itemId === item.id);

      if (existingIngredient) {
        const nextQuantity = existingIngredient.quantity + 1;
        setIngredientInputValues((prevValues) => ({
          ...prevValues,
          [item.id]: String(nextQuantity),
        }));

        return prevIngredients.map((ingredient) =>
          ingredient.itemId === item.id
            ? { ...ingredient, quantity: nextQuantity }
            : ingredient,
        );
      }

      setIngredientInputValues((prevValues) => ({
        ...prevValues,
        [item.id]: '1',
      }));

      return [...prevIngredients, { itemId: item.id, quantity: 1, item }];
    });
  };

  const handleQuantityChange = (itemId: number, direction: 'increment' | 'decrement') => {
    setIngredients((prevIngredients) =>
      prevIngredients
        .map((ingredient) => {
          if (ingredient.itemId !== itemId) {
            return ingredient;
          }

          const nextQuantity = direction === 'increment' ? ingredient.quantity + 1 : ingredient.quantity - 1;
          setIngredientInputValues((prevValues) => {
            if (nextQuantity <= 0) {
              const nextValues = { ...prevValues };
              delete nextValues[itemId];
              return nextValues;
            }

            return {
              ...prevValues,
              [itemId]: String(nextQuantity),
            };
          });

          return { ...ingredient, quantity: nextQuantity };
        })
        .filter((ingredient) => ingredient.quantity > 0),
    );
  };

  const handleQuantityInputChange = (itemId: number, rawValue: string) => {
    if (!/^\d*$/.test(rawValue)) {
      return;
    }

    setIngredientInputValues((prevValues) => ({
      ...prevValues,
      [itemId]: rawValue,
    }));

    if (rawValue === '') {
      return;
    }

    const nextQuantity = Number(rawValue);

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }

    setIngredients((prevIngredients) =>
      prevIngredients.map((ingredient) =>
        ingredient.itemId === itemId
          ? { ...ingredient, quantity: Math.floor(nextQuantity) }
          : ingredient,
      ),
    );
  };

  const handleQuantityInputBlur = (itemId: number) => {
    const currentIngredient = ingredients.find((ingredient) => ingredient.itemId === itemId);

    if (!currentIngredient) {
      return;
    }

    setIngredientInputValues((prevValues) => {
      const rawValue = prevValues[itemId];

      if (!rawValue || Number(rawValue) < 1) {
        return {
          ...prevValues,
          [itemId]: String(currentIngredient.quantity),
        };
      }

      return {
        ...prevValues,
        [itemId]: String(Math.floor(Number(rawValue))),
      };
    });
  };

  const handleClear = () => {
    setTemplateName('');
    setTemplateImageUrl('');
    setSalePrice('');
    setIngredients([]);
    setIngredientInputValues({});
    setStatusMessage('');
    setFormError('');
  };

  const handleSaveTemplate = async () => {
    if (isSubmitting) {
      return;
    }

    if (templateName.trim() === '' && parsedSalePrice <= 0) {
      setFormError('Заполни название букета и цену продажи.');
      return;
    }

    if (templateName.trim() === '') {
      setFormError('Заполни название букета.');
      return;
    }

    if (parsedSalePrice <= 0) {
      setFormError('Укажи цену продажи.');
      return;
    }

    if (ingredients.length === 0) {
      setFormError('Добавь хотя бы один ингредиент в шаблон.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      setStatusMessage('');

      const payload = {
        name: templateName.trim(),
        imageUrl: templateImageUrl.trim() ? templateImageUrl.trim() : null,
        price: parsedSalePrice,
        ingredients: ingredients.map((ingredient) => ({
          itemId: ingredient.itemId,
          quantity: ingredient.quantity,
        })),
      };

      const { data } = await axiosApi.post<BouquetTemplateResponse>('/inventory/templates', payload);

      setStatusMessage(`Шаблон «${data.template.name}» сохранен.`);
      handleClear();
    } catch {
      setFormError('Не удалось сохранить шаблон. Проверь данные и попробуй еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPreview = () => {
    setPreviewData({
      name: templateName,
      imageUrl: templateImageUrl.trim() ? templateImageUrl.trim() : null,
      ingredients,
    });
  };

  const handleClosePreview = () => {
    setPreviewData(null);
  };

  return (
    <section className="bouquets-container">
      <BouquetsPreviewModal previewData={previewData} onClose={handleClosePreview} />

      <div className="bouquets-catalog">
        <div className="bouquets-catalog-header">
          <div className="bouquets-catalog-top">
            <div className="bouquets-catalog-title-wrap">
              <div className="bouquets-catalog-icon">
                <CatalogSparkIcon className="bouquets-catalog-icon-svg" />
              </div>
              <h2 className="bouquets-catalog-tittle">Каталог</h2>
            </div>

            <span className="bouquets-catalog-count">{filteredCatalogItems.length} позиций</span>
          </div>

          <label className="bouquets-catalog-search">
            <SearchIconForBouquets className="bouquets-catalog-search-icon" />
            <input
              type="text"
              className="bouquets-catalog-search-input"
              placeholder="Поиск ингредиентов..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>

          <div className="bouquets-catalog-filters">
            {bouquetFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={
                  selectedFilter === filter
                    ? 'bouquets-catalog-filter bouquets-catalog-filter-active'
                    : 'bouquets-catalog-filter'
                }
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="bouquets-catalog-list">
          {isLoading ? <div className="bouquets-catalog-placeholder">Загружаем каталог...</div> : null}
          {!isLoading && catalogError && catalogItems.length === 0 ? (
            <div className="bouquets-catalog-placeholder">{catalogError}</div>
          ) : null}
          {!isLoading && !catalogError && filteredCatalogItems.length === 0 ? (
            <div className="bouquets-catalog-placeholder">По этому фильтру ингредиенты не найдены.</div>
          ) : null}

          {!isLoading && !catalogError
            ? filteredCatalogItems.map((item) => (
                <article key={item.id} className="bouquets-catalog-list-item">
                  <div className="bouquets-catalog-item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="bouquets-catalog-item-photo" />
                    ) : (
                      <InventoryFallbackIcon className="bouquets-catalog-item-fallback" />
                    )}
                  </div>

                  <div className="bouquets-catalog-item-info">
                    <h3 className="bouquets-catalog-item-tittle">{item.name}</h3>
                    <div className="bouquets-catalog-item-bottom">
                      <span className="bouquets-catalog-item-price">{formatNumber(item.price)} KGS</span>
                      <button
                        type="button"
                        className="bouquets-catalog-item-add"
                        aria-label={`Добавить ${item.name} в шаблон`}
                        onClick={() => handleAddIngredient(item)}
                      >
                        <PlusIconForBouquets className="bouquets-catalog-item-add-icon" />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            : null}
        </div>
      </div>

      <div className="bouquets-form">
        <div className="bouquets-form-top">
          <div className="bouquets-form-card">
            <div className="bouquets-form-card-header">
              <div className="bouquets-form-card-icon">
                <ReceiptIconForBouquets className="bouquets-form-card-icon-svg" />
              </div>
              <div className="bouquets-form-card-heading">
                <h2 className="bouquets-form-card-title">Параметры шаблона</h2>
                <p className="bouquets-form-card-subtitle">Создание нового букета</p>
              </div>
            </div>

            <div className="bouquets-form-fields">
              <label className="bouquets-form-field">
                <span className="bouquets-form-label">НАЗВАНИЕ БУКЕТА</span>
                <input
                  type="text"
                  className="bouquets-form-input"
                  placeholder="Например: Нежный рассвет"
                  value={templateName}
                  required
                  aria-required="true"
                  onChange={(event) => setTemplateName(event.target.value)}
                />
              </label>

              <label className="bouquets-form-field">
                <span className="bouquets-form-label">URL ФОТО</span>
                <input
                  type="url"
                  className="bouquets-form-input"
                  placeholder="https://..."
                  value={templateImageUrl}
                  onChange={(event) => setTemplateImageUrl(event.target.value)}
                />
              </label>

              <label className="bouquets-form-field bouquets-form-field-price">
                <span className="bouquets-form-label">ЦЕНА ПРОДАЖИ</span>
                <input
                  type="number"
                  min="0"
                  className="bouquets-form-input"
                  placeholder="0"
                  value={salePrice}
                  required
                  aria-required="true"
                  onChange={(event) => setSalePrice(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bouquets-form-composition">
          <div className="bouquets-form-composition-header">
            <h2 className="bouquets-form-composition-title">Состав букета</h2>
            <span className="bouquets-form-composition-count">Итого: {totalUnits} шт.</span>
          </div>

          {ingredients.length > 0 ? (
            <>
              <div className="bouquets-form-table-head">
                <span>НАИМЕНОВАНИЕ</span>
                <span>КОЛ-ВО</span>
                <span>СУММА</span>
              </div>

              <div className="bouquets-form-composition-list">
                {ingredients.map((ingredient) => (
                  <article key={ingredient.itemId} className="bouquets-form-composition-item">
                    <div className="bouquets-form-composition-item-main">
                      <div className="bouquets-form-composition-item-icon">
                        <BouquetModalPositionIcon className="bouquets-form-composition-item-icon-svg" />
                      </div>
                      <div className="bouquets-form-composition-item-text">
                        <h3 className="bouquets-form-composition-item-title">{ingredient.item.name}</h3>
                        <span className="bouquets-form-composition-item-price">
                          {formatNumber(ingredient.item.price)} KGS
                        </span>
                      </div>
                    </div>

                    <div className="bouquets-form-composition-item-controls">
                      <button
                        type="button"
                        className="bouquets-form-quantity-btn"
                        onClick={() => handleQuantityChange(ingredient.itemId, 'decrement')}
                      >
                        <MinusIconForBouquets className="bouquets-form-quantity-btn-icon" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        className="bouquets-form-quantity-input"
                        value={ingredientInputValues[ingredient.itemId] ?? String(ingredient.quantity)}
                        onChange={(event) => handleQuantityInputChange(ingredient.itemId, event.target.value)}
                        onBlur={() => handleQuantityInputBlur(ingredient.itemId)}
                        onFocus={(event) => event.target.select()}
                        aria-label={`Количество для ${ingredient.item.name}`}
                      />
                      <button
                        type="button"
                        className="bouquets-form-quantity-btn"
                        onClick={() => handleQuantityChange(ingredient.itemId, 'increment')}
                      >
                        <SmallPlusIconForBouquets className="bouquets-form-quantity-btn-icon" />
                      </button>
                    </div>

                    <div className="bouquets-form-composition-item-sum">
                      {formatNumber(ingredient.item.costPrice * ingredient.quantity)} KGS
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="bouquets-form-empty">
              <div className="bouquets-form-empty-icon">
                <EmptyBouquetIcon className="bouquets-form-empty-icon-svg" />
              </div>
              <h3 className="bouquets-form-empty-title">Начните сборку</h3>
              <p className="bouquets-form-empty-text">
                Добавляйте цветы и упаковку из каталога слева, кликая на кнопку +. Рецепт будет формироваться здесь.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bouquets-total">
        <div className="bouquets-total-pricing">
          <div className="bouquets-total-pricing-head">
            <SummaryTrendIcon className="bouquets-total-pricing-icon" />
            <h2 className="bouquets-total-pricing-title">Сводка по шаблону</h2>
          </div>

          <div className="bouquets-total-pricing-list">
            <div className="bouquets-total-pricing-row">
              <span className="bouquets-total-pricing-label">Себестоимость</span>
              <span className="bouquets-total-pricing-value">{formatNumber(totalCost)} KGS</span>
            </div>
            <div className="bouquets-total-pricing-row">
              <span className="bouquets-total-pricing-label">Цена продажи</span>
              <span className="bouquets-total-pricing-value">{formatNumber(parsedSalePrice)} KGS</span>
            </div>
          </div>

          <div className="bouquets-total-pricing-divider" />

          <div className="bouquets-total-pricing-footer">
            <div className="bouquets-total-pricing-result">
              <span className="bouquets-total-pricing-label">Прибыль</span>
              <strong className="bouquets-total-pricing-profit">{formatNumber(Math.max(totalProfit, 0))} KGS</strong>
            </div>
            <div className="bouquets-total-pricing-result bouquets-total-pricing-result-right">
              <span className="bouquets-total-pricing-label">Маржа</span>
              <strong className="bouquets-total-pricing-percent">{Math.round(marginPercent)}%</strong>
            </div>
          </div>
        </div>

        <div className="bouquets-total-actions">
          <button
            type="button"
            className={isFormValid ? 'bouquets-save-btn bouquets-save-btn-active' : 'bouquets-save-btn'}
            disabled={isSubmitting}
            onClick={handleSaveTemplate}
          >
            <SaveIconForBouquets className="bouquets-save-btn-icon" />
            <span>{isSubmitting ? 'Сохраняем...' : 'Сохранить шаблон'}</span>
          </button>

          <button type="button" className="bouquets-preview-btn" onClick={handleOpenPreview}>
            <PreviewIconForBouquets className="bouquets-preview-btn-icon" />
            <span>Предпросмотр</span>
          </button>

          <button type="button" className="bouquets-cancel-btn" onClick={handleClear}>
            <CancelIconForBouquets className="bouquets-cancel-btn-icon" />
            <span>Очистить</span>
          </button>

          {formError ? <p className="bouquets-status bouquets-status-error">{formError}</p> : null}
          {!formError && statusMessage ? <p className="bouquets-status bouquets-status-success">{statusMessage}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default Bouquets;
