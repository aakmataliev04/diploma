import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { axiosApi } from '../../axiosApi';
import type {
  BouquetTemplate,
  CreateOrderResponse,
  InventoryItem,
  PosBasketItem,
  PosCatalogEntry,
  PosCatalogFilter,
  PosOrderSource,
} from '../../types';
import { InventoryFallbackIcon } from '../Inventory/components/InventoryIcons/InventoryIcons';
import {
  CalendarIconForPos,
  ChevronDownIconForPos,
  EventIconForPos,
  FormNameIconForPos,
  FormPhoneIconForPos,
  SearchIconForPos,
  SourceIconForPos,
  TrashIconForPos,
} from './components/PosIcons/PosIcons';
import './Pos.css';

const posFilters: PosCatalogFilter[] = ['Все', 'Букеты', 'Цветы', 'Упаковка', 'Аксессуары', 'Услуги'];
const orderSources: PosOrderSource[] = ['С улицы', 'WhatsApp', 'Instagram', '2 GIS'];

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const getPhoneCountryFlags = (phoneValue: string) => {
  const normalizedValue = phoneValue.trim();

  if (normalizedValue.startsWith('+996')) {
    return ['🇰🇬'];
  }

  if (normalizedValue.startsWith('+7')) {
    return ['🇷🇺', '🇰🇿'];
  }

  return [];
};

const getMaxPhoneLength = (phoneValue: string) => {
  const normalizedValue = phoneValue.trim();

  if (normalizedValue.startsWith('+996')) {
    return 13;
  }

  if (normalizedValue.startsWith('+7')) {
    return 12;
  }

  return 16;
};

const getPosFilterByCategory = (category: InventoryItem['category']): PosCatalogFilter => {
  if (category === 'FLOWER') {
    return 'Цветы';
  }

  if (category === 'SERVICE') {
    return 'Услуги';
  }

  if (category === 'ACCESSORY') {
    return 'Аксессуары';
  }

  return 'Упаковка';
};

const Pos = () => {
  const eventDateRef = useRef<HTMLInputElement | null>(null);
  const [catalogItems, setCatalogItems] = useState<PosCatalogEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<PosCatalogFilter>('Букеты');
  const [searchValue, setSearchValue] = useState('');
  const [basketItems, setBasketItems] = useState<PosBasketItem[]>([]);
  const [basketInputValues, setBasketInputValues] = useState<Record<string, string>>({});
  const [source, setSource] = useState<PosOrderSource>('С улицы');
  const [isAnonymousOrder, setIsAnonymousOrder] = useState(false);
  const [phone, setPhone] = useState('+996');
  const [clientName, setClientName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        setCatalogError('');

        const [inventoryResponse, templatesResponse] = await Promise.all([
          axiosApi.get<InventoryItem[]>('/inventory'),
          axiosApi.get<BouquetTemplate[]>('/inventory/templates'),
        ]);

        const normalizedItems: PosCatalogEntry[] = inventoryResponse.data.map((item) => ({
          id: `item-${item.id}`,
          entityId: item.id,
          type: 'item',
          name: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          filter: getPosFilterByCategory(item.category),
        }));

        const normalizedTemplates: PosCatalogEntry[] = templatesResponse.data.map((template) => ({
          id: `bouquet-${template.id}`,
          entityId: template.id,
          type: 'bouquet',
          name: template.name,
          imageUrl: template.imageUrl,
          price: template.price,
          filter: 'Букеты',
        }));

        setCatalogItems([...normalizedTemplates, ...normalizedItems]);
      } catch {
        setCatalogError('Не удалось загрузить каталог POS.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCatalog();
  }, []);

  const normalizedSearchValue = deferredSearchValue.trim().toLowerCase();
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchesFilter = selectedFilter === 'Все' || item.filter === selectedFilter;
      const matchesSearch =
        normalizedSearchValue === '' || item.name.toLowerCase().includes(normalizedSearchValue);

      return matchesFilter && matchesSearch;
    });
  }, [catalogItems, normalizedSearchValue, selectedFilter]);

  const totalPrice = basketItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalUnits = basketItems.reduce((sum, item) => sum + item.quantity, 0);
  const phoneCountryFlags = getPhoneCountryFlags(phone);

  const handlePhoneChange = (rawValue: string) => {
    const sanitizedValue = rawValue
      .replace(/[^\d+]/g, '')
      .replace(/(?!^)\+/g, '');

    const maxLength = getMaxPhoneLength(sanitizedValue);
    setPhone(sanitizedValue.slice(0, maxLength));
  };

  const addToBasket = (catalogItem: PosCatalogEntry) => {
    setSubmitError('');
    setSubmitStatus('');

    setBasketItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === catalogItem.id);

      if (existingItem) {
        const nextQuantity = existingItem.quantity + 1;
        setBasketInputValues((prevValues) => ({
          ...prevValues,
          [catalogItem.id]: String(nextQuantity),
        }));

        return prevItems.map((item) =>
          item.id === catalogItem.id ? { ...item, quantity: nextQuantity } : item,
        );
      }

      setBasketInputValues((prevValues) => ({
        ...prevValues,
        [catalogItem.id]: '1',
      }));

      return [
        ...prevItems,
        {
          id: catalogItem.id,
          entityId: catalogItem.entityId,
          type: catalogItem.type,
          name: catalogItem.name,
          price: catalogItem.price,
          quantity: 1,
        },
      ];
    });
  };

  const changeBasketQuantity = (basketItemId: string, direction: 'increment' | 'decrement') => {
    setBasketItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id !== basketItemId) {
            return item;
          }

          const nextQuantity = direction === 'increment' ? item.quantity + 1 : item.quantity - 1;
          setBasketInputValues((prevValues) => {
            if (nextQuantity <= 0) {
              const nextValues = { ...prevValues };
              delete nextValues[basketItemId];
              return nextValues;
            }

            return {
              ...prevValues,
              [basketItemId]: String(nextQuantity),
            };
          });

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromBasket = (basketItemId: string) => {
    setBasketInputValues((prevValues) => {
      const nextValues = { ...prevValues };
      delete nextValues[basketItemId];
      return nextValues;
    });

    setBasketItems((prevItems) => prevItems.filter((item) => item.id !== basketItemId));
  };

  const handleBasketQuantityInputChange = (basketItemId: string, rawValue: string) => {
    if (!/^\d*$/.test(rawValue)) {
      return;
    }

    setBasketInputValues((prevValues) => ({
      ...prevValues,
      [basketItemId]: rawValue,
    }));

    if (rawValue === '') {
      return;
    }

    const nextQuantity = Number(rawValue);

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }

    setBasketItems((prevItems) =>
      prevItems.map((item) =>
        item.id === basketItemId
          ? { ...item, quantity: Math.floor(nextQuantity) }
          : item,
      ),
    );
  };

  const handleBasketQuantityInputBlur = (basketItemId: string) => {
    const currentItem = basketItems.find((item) => item.id === basketItemId);

    if (!currentItem) {
      return;
    }

    setBasketInputValues((prevValues) => {
      const rawValue = prevValues[basketItemId];

      if (!rawValue || Number(rawValue) < 1) {
        return {
          ...prevValues,
          [basketItemId]: String(currentItem.quantity),
        };
      }

      return {
        ...prevValues,
        [basketItemId]: String(Math.floor(Number(rawValue))),
      };
    });
  };

  const resetOrderForm = () => {
    setBasketItems([]);
    setBasketInputValues({});
    setSource('С улицы');
    setIsAnonymousOrder(false);
    setPhone('+996');
    setClientName('');
    setEventTitle('');
    setEventDate('');
  };

  const handleSubmitOrder = async () => {
    if (basketItems.length === 0 || isSubmitting) {
      setSubmitError('Добавь хотя бы одну позицию в корзину.');
      return;
    }

    if (!isAnonymousOrder) {
      const normalizedPhone = phone.trim();
      const hasPhone = normalizedPhone !== '' && normalizedPhone !== '+996';

      if (!hasPhone) {
        setSubmitError('Заполни номер телефона клиента.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitStatus('');

      const payload = {
        source,
        phone: !isAnonymousOrder && phone.trim() ? phone.trim() : undefined,
        name: !isAnonymousOrder && clientName.trim() ? clientName.trim() : undefined,
        items: basketItems
          .filter((item) => item.type === 'item')
          .map((item) => ({
            itemId: item.entityId,
            quantity: item.quantity,
          })),
        bouquets: basketItems
          .filter((item) => item.type === 'bouquet')
          .map((item) => ({
            bouquetTemplateId: item.entityId,
            quantity: item.quantity,
          })),
        event:
          !isAnonymousOrder && eventTitle.trim() && eventDate
            ? {
                title: eventTitle.trim(),
                date: eventDate,
              }
            : undefined,
      };

      const { data } = await axiosApi.post<CreateOrderResponse>('/orders', payload);

      setSubmitStatus(data.message || 'Заказ успешно оформлен.');
      resetOrderForm();
    } catch {
      setSubmitError('Не удалось оформить заказ. Проверь данные и попробуй еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNativeDatePicker = () => {
    if (eventDateRef.current?.showPicker) {
      eventDateRef.current.showPicker();
      return;
    }

    eventDateRef.current?.focus();
  };

  return (
    <section className="pos-page">
      <div className="pos-catalog">
        <label className="pos-catalog-search">
          <SearchIconForPos className="pos-catalog-search-icon" />
          <input
            type="text"
            className="pos-catalog-search-input"
            placeholder="Поиск товаров..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </label>

        <div className="pos-catalog-categories">
          {posFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={
                selectedFilter === filter
                  ? 'pos-catalog-category pos-catalog-category-active'
                  : 'pos-catalog-category'
              }
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="pos-catalog-list">
          {isLoading ? <div className="pos-catalog-placeholder">Загружаем каталог...</div> : null}
          {!isLoading && catalogError ? (
            <div className="pos-catalog-placeholder">{catalogError}</div>
          ) : null}
          {!isLoading && !catalogError && filteredCatalogItems.length === 0 ? (
            <div className="pos-catalog-placeholder">По этому фильтру товары не найдены.</div>
          ) : null}

          {!isLoading && !catalogError
            ? filteredCatalogItems.map((item) => (
                <article key={item.id} className="pos-catalog-card" onClick={() => addToBasket(item)} role="button" tabIndex={0} onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    addToBasket(item);
                  }
                }}>
                  <div className="pos-catalog-card-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="pos-catalog-card-photo" />
                    ) : (
                      <InventoryFallbackIcon className="pos-catalog-card-fallback" />
                    )}
                  </div>
                  <div className="pos-catalog-card-content">
                    <h3 className="pos-catalog-card-tittle">{item.name}</h3>
                    <p className="pos-catalog-card-price">{formatNumber(item.price)} KGS</p>
                  </div>
                </article>
              ))
            : null}
        </div>
      </div>

      <div className="pos-form">
        <div className="pos-form-scroll">
          <div className="pos-form-header">
            <h2 className="pos-form-tittle">Оформление</h2>

            <label className="pos-form-toggle">
              <input
                type="checkbox"
                className="pos-form-toggle-input"
                checked={isAnonymousOrder}
                onChange={(event) => setIsAnonymousOrder(event.target.checked)}
              />
              <span className="pos-form-toggle-track">
                <span className="pos-form-toggle-thumb" />
              </span>
              <span className="pos-form-toggle-label">Анонимный заказ</span>
            </label>
          </div>

          <label className="pos-form-input-source">
            <SourceIconForPos className="pos-form-input-icon" />
            <select
              className="pos-form-select"
              value={source}
              onChange={(event) => setSource(event.target.value as PosOrderSource)}
            >
              {orderSources.map((sourceItem) => (
                <option key={sourceItem} value={sourceItem}>
                  {sourceItem}
                </option>
              ))}
            </select>
            <ChevronDownIconForPos className="pos-form-select-arrow" />
          </label>

          {!isAnonymousOrder ? (
            <>
              <section className="pos-form-client">
                <div className="pos-form-block-header">
                  <h3 className="pos-form-block-title">Данные клиента</h3>
                  <span className="pos-form-loyalty">Лояльность</span>
                </div>

                <label className="pos-form-input pos-form-input-number">
                  {phoneCountryFlags.length > 0 ? (
                    <span className="pos-form-phone-flags" aria-hidden="true">
                      {phoneCountryFlags.map((flag) => (
                        <span key={flag} className="pos-form-phone-flag">
                          {flag}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <FormPhoneIconForPos className="pos-form-input-icon" />
                  )}
                  <input
                    type="tel"
                    className="pos-form-input-field"
                    placeholder="+996 (___) ___-___"
                    value={phone}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                  />
                </label>

                <label className="pos-form-input pos-form-input-name">
                  <FormNameIconForPos className="pos-form-input-icon" />
                  <input
                    type="text"
                    className="pos-form-input-field"
                    placeholder="Имя клиента (необязательно)"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                  />
                </label>
              </section>

              <section className="pos-form-event">
                <div className="pos-form-event-header">
                  <div className="pos-form-event-icon">
                    <EventIconForPos className="pos-form-event-icon-svg" />
                  </div>
                  <div className="pos-form-event-text">
                    <h3 className="pos-form-event-tittle">Повод / событие</h3>
                    <p className="pos-form-event-description">
                      Необязательно. Помогает напомнить клиенту о важном дне в следующем году.
                    </p>
                  </div>
                </div>

                <label className="pos-form-event-name">
                  <input
                    type="text"
                    className="pos-form-input-field"
                    placeholder="Название события (необязательно)"
                    value={eventTitle}
                    onChange={(event) => setEventTitle(event.target.value)}
                  />
                </label>

                <label className="pos-form-event-date">
                  <CalendarIconForPos className="pos-form-input-icon" />
                  <input
                    ref={eventDateRef}
                    type="date"
                    className="pos-form-input-field pos-form-date-input"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="pos-form-date-trigger"
                    aria-label="Открыть календарь"
                    onClick={openNativeDatePicker}
                  >
                    <CalendarIconForPos className="pos-form-date-trigger-icon" />
                  </button>
                </label>
              </section>
            </>
          ) : null}

          <section className="pos-basket-section">
            <div className="pos-basket-header">
              <h3 className="pos-basket-title">КОРЗИНА ЗАКАЗА</h3>
              <span className="pos-basket-count">{totalUnits} шт.</span>
            </div>

            <div className="pos-basket">
              {basketItems.length === 0 ? (
                <div className="pos-basket-empty">Добавь товары из каталога, чтобы собрать заказ.</div>
              ) : (
                basketItems.map((item) => (
                  <article key={item.id} className="pos-basket-item">
                    <div className="pos-basket-item-main">
                      <div className="pos-basket-item-text">
                        <h4 className="pos-basket-item-name">{item.name}</h4>
                        <span className="pos-basket-item-meta">
                          {formatNumber(item.price)} KGS / шт
                        </span>
                      </div>

                      <button
                        type="button"
                        className="pos-basket-item-remove"
                        aria-label={`Удалить ${item.name}`}
                        onClick={() => removeFromBasket(item.id)}
                      >
                        <TrashIconForPos className="pos-basket-item-remove-icon" />
                      </button>
                    </div>

                  <div className="pos-basket-item-footer">
                      <div className="pos-basket-item-quantity">
                        <button
                          type="button"
                          className="pos-basket-quantity-btn"
                          onClick={() => changeBasketQuantity(item.id, 'decrement')}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className="pos-basket-quantity-input"
                          value={basketInputValues[item.id] ?? String(item.quantity)}
                          onChange={(event) => handleBasketQuantityInputChange(item.id, event.target.value)}
                          onBlur={() => handleBasketQuantityInputBlur(item.id)}
                          onFocus={(event) => event.target.select()}
                          aria-label={`Количество для ${item.name}`}
                        />
                        <button
                          type="button"
                          className="pos-basket-quantity-btn"
                          onClick={() => changeBasketQuantity(item.id, 'increment')}
                        >
                          +
                        </button>
                      </div>
                      <strong className="pos-basket-item-sum">
                        {formatNumber(item.price * item.quantity)} KGS
                      </strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="pos-form-footer">
          {submitError ? <p className="pos-form-status pos-form-status-error">{submitError}</p> : null}
          {!submitError && submitStatus ? (
            <p className="pos-form-status pos-form-status-success">{submitStatus}</p>
          ) : null}

          <div className="pos-form-total">
            <span className="pos-form-total-label">К оплате:</span>
            <strong className="pos-form-total-value">{formatNumber(totalPrice)} KGS</strong>
          </div>

          <button
            type="button"
            className="pos-form-submit"
            onClick={handleSubmitOrder}
            disabled={basketItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Оформляем заказ...' : 'Оплатить заказ'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pos;
