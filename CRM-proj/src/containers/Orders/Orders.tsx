import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { axiosApi } from '../../axiosApi';
import type {
  OrderListItemApi,
  OrdersApiPeriod,
  OrdersListResponse,
  OrdersSegment,
  OrdersSummaryApi,
  PosOrderSource,
} from '../../types';
import OrdersDetailModal from './components/OrdersDetailModal/OrdersDetailModal';
import {
  OrdersAnonIcon,
  OrdersAvgIcon,
  OrdersBoxIcon,
  OrdersCalendarIcon,
  OrdersEyeIcon,
  OrdersMoneyIcon,
  OrdersSearchIcon,
} from './components/OrdersIcons';
import './Orders.css';

type PeriodUi = 'Сегодня' | 'Вчера' | 'Неделя' | 'Месяц' | 'custom';

const periodTabs: Array<{ label: Exclude<PeriodUi, 'custom'>; value: OrdersApiPeriod }> = [
  { label: 'Сегодня', value: 'today' },
  { label: 'Вчера', value: 'yesterday' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
];

const getInputDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialCustomFrom = () => {
  const today = new Date();
  return getInputDateValue(new Date(today.getFullYear(), today.getMonth(), 1));
};

const getInitialCustomTo = () => getInputDateValue(new Date());

const formatShortDate = (value: string) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
};

const segmentOptions: Array<{ value: OrdersSegment; label: string }> = [
  { value: 'all', label: 'Все заказы' },
  { value: 'anonymous', label: 'Анонимные' },
  { value: 'loyalty', label: 'Клиенты лояльности' },
];

const sourceOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Все источники' },
  { value: 'С улицы', label: 'С улицы' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Telegram', label: 'Telegram' },
  { value: '2 GIS', label: '2GIS' },
];

const emptySummary: OrdersSummaryApi = {
  ordersCount: 0,
  revenue: 0,
  averageCheck: 0,
  anonymousCount: 0,
};

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bishkek',
  }).format(new Date(value));

const getClientName = (order: OrderListItemApi) => {
  if (!order.client) {
    return 'Аноним';
  }
  return order.client.name?.trim() || `Клиент #${order.client.id}`;
};

const getStaffRoleLabel = (role: string) => {
  const normalized = role.toUpperCase();
  if (normalized === 'ADMIN') {
    return 'Админ';
  }
  if (normalized === 'FLORIST') {
    return 'Флорист';
  }
  return role;
};

const getCreatedByLabel = (order: OrderListItemApi) => {
  if (!order.createdBy) {
    return '—';
  }
  return order.createdBy.name.trim() || `Сотрудник #${order.createdBy.id}`;
};

const getSourceClass = (source: string) => {
  const normalized = source.toLowerCase();
  if (normalized.includes('2') && normalized.includes('gis')) return 'is-2gis';
  if (normalized.includes('whatsapp')) return 'is-whatsapp';
  if (normalized.includes('instagram')) return 'is-instagram';
  if (normalized.includes('telegram')) return 'is-telegram';
  if (normalized.includes('улиц') || normalized.includes('walk')) return 'is-walkin';
  return 'is-default';
};

const Orders = () => {
  const [period, setPeriod] = useState<OrdersApiPeriod>('today');
  const [customFrom, setCustomFrom] = useState(getInitialCustomFrom);
  const [customTo, setCustomTo] = useState(getInitialCustomTo);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segment, setSegment] = useState<OrdersSegment>('all');
  const [source, setSource] = useState<string>('all');
  const [summary, setSummary] = useState<OrdersSummaryApi>(emptySummary);
  const [orders, setOrders] = useState<OrderListItemApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderListItemApi | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  const fetchOrders = useCallback(async () => {
    if (period === 'custom') {
      if (!customFrom || !customTo) {
        return;
      }

      if (customFrom > customTo) {
        setErrorMessage('Дата «от» не может быть позже даты «до».');
        setSummary(emptySummary);
        setOrders([]);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axiosApi.get<OrdersListResponse>('/orders', {
        params: {
          period,
          q: debouncedSearch || undefined,
          segment,
          source: source === 'all' ? undefined : source,
          from: period === 'custom' ? customFrom : undefined,
          to: period === 'custom' ? customTo : undefined,
        },
      });

      setSummary(data.summary ?? emptySummary);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setSummary(emptySummary);
      setOrders([]);
      setErrorMessage('Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo, debouncedSearch, segment, source]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const infoCards = useMemo(
    () => [
      {
        id: 'count',
        title: 'Всего заказов',
        value: formatNumber(summary.ordersCount),
        icon: <OrdersBoxIcon className="orders-info-card-icon-svg" />,
        tone: 'pink' as const,
      },
      {
        id: 'revenue',
        title: 'Выручка',
        value: `${formatNumber(summary.revenue)} KGS`,
        icon: <OrdersMoneyIcon className="orders-info-card-icon-svg" />,
        tone: 'green' as const,
      },
      {
        id: 'avg',
        title: 'Средний чек',
        value: `${formatNumber(summary.averageCheck)} KGS`,
        icon: <OrdersAvgIcon className="orders-info-card-icon-svg" />,
        tone: 'purple' as const,
      },
      {
        id: 'anon',
        title: 'Анонимные продажи',
        value: formatNumber(summary.anonymousCount),
        icon: <OrdersAnonIcon className="orders-info-card-icon-svg" />,
        tone: 'blue' as const,
      },
    ],
    [summary],
  );

  const handleEnableCustomPeriod = () => {
    setPeriod('custom');
    if (!customFrom) {
      setCustomFrom(getInitialCustomFrom());
    }
    if (!customTo) {
      setCustomTo(getInitialCustomTo());
    }
  };

  const handleCustomFromChange = (value: string) => {
    setCustomFrom(value);
    setPeriod('custom');

    if (value && customTo && value > customTo) {
      toast.error('Дата «от» не может быть позже даты «до».');
    }
  };

  const handleCustomToChange = (value: string) => {
    setCustomTo(value);
    setPeriod('custom');

    if (value && customFrom && customFrom > value) {
      toast.error('Дата «до» не может быть раньше даты «от».');
    }
  };

  return (
    <section className="orders-page">
      <div className="orders-info-grid">
        {infoCards.map((card) => (
          <article key={card.id} className={`orders-info-card orders-info-card-${card.tone}`}>
            <span className="orders-info-card-icon">{card.icon}</span>
            <div className="orders-info-card-text">
              <p className="orders-info-card-title">{card.title}</p>
              <p className="orders-info-card-value">{card.value}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="orders-toolbar">
        <div className="orders-period-tabs" role="tablist" aria-label="Период">
          {periodTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={period === tab.value}
              className={`orders-period-tab${period === tab.value ? ' is-active' : ''}`}
              onClick={() => setPeriod(tab.value)}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            className={`orders-period-tab orders-period-tab-calendar${period === 'custom' ? ' is-active' : ''}`}
            aria-label="Выбрать период"
            aria-pressed={period === 'custom'}
            onClick={handleEnableCustomPeriod}
          >
            <OrdersCalendarIcon className="orders-period-calendar-icon" />
          </button>
        </div>

        {period === 'custom' ? (
          <div className="orders-custom-range" aria-label="Произвольный период">
            <label className="orders-custom-range-field">
              <span className="orders-custom-range-label">От</span>
              <input
                type="date"
                className="orders-custom-range-input"
                value={customFrom}
                max={customTo || undefined}
                onChange={(event) => handleCustomFromChange(event.target.value)}
              />
            </label>
            <span className="orders-custom-range-separator">—</span>
            <label className="orders-custom-range-field">
              <span className="orders-custom-range-label">До</span>
              <input
                type="date"
                className="orders-custom-range-input"
                value={customTo}
                min={customFrom || undefined}
                onChange={(event) => handleCustomToChange(event.target.value)}
              />
            </label>
            {customFrom && customTo ? (
              <span className="orders-custom-range-hint">
                {formatShortDate(customFrom)} — {formatShortDate(customTo)}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="orders-filters-row">
          <label className="orders-search">
            <OrdersSearchIcon className="orders-search-icon" />
            <input
              type="search"
              className="orders-search-input"
              placeholder="Поиск по телефону, имени или номеру заказа..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>

          <select
            className="orders-select"
            value={segment}
            onChange={(event) => setSegment(event.target.value as OrdersSegment)}
            aria-label="Сегмент заказов"
          >
            {segmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="orders-select"
            value={source}
            onChange={(event) => setSource(event.target.value as PosOrderSource | 'all')}
            aria-label="Источник заказа"
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? <p className="orders-status orders-status-error">{errorMessage}</p> : null}
      {isLoading ? <p className="orders-status">Загрузка заказов...</p> : null}

      <div className="orders-table-wrap">
        <div className="orders-table-head">
          <span>Заказ</span>
          <span>Клиент</span>
          <span>Оформил</span>
          <span>Источник</span>
          <span>Позиции</span>
          <span>Сумма</span>
          <span>Действия</span>
        </div>

        <div className="orders-table-body">
          {!isLoading && orders.length === 0 ? (
            <p className="orders-empty">Заказов за выбранный период нет</p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="orders-table-row">
                <div className="orders-cell orders-cell-order">
                  <strong># {order.displayNumber}</strong>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>

                <div className="orders-cell orders-cell-client">
                  {order.client ? (
                    <>
                      <strong>{getClientName(order)}</strong>
                      <span>{order.client.phone}</span>
                    </>
                  ) : (
                    <strong className="orders-anon-label">Аноним</strong>
                  )}
                </div>

                <div className="orders-cell orders-cell-staff">
                  <strong>{getCreatedByLabel(order)}</strong>
                  {order.createdBy ? (
                    <span>{getStaffRoleLabel(order.createdBy.role)}</span>
                  ) : (
                    <span>Неизвестно</span>
                  )}
                </div>

                <div className="orders-cell">
                  <span className={`orders-source-badge ${getSourceClass(order.source)}`}>{order.source}</span>
                </div>

                <div className="orders-cell orders-cell-positions">{order.positionsCount} шт.</div>

                <div className="orders-cell orders-cell-sum">
                  <strong>{formatNumber(order.totalPrice)} KGS</strong>
                </div>

                <div className="orders-cell orders-cell-actions">
                  <button
                    type="button"
                    className="orders-view-btn"
                    aria-label={`Открыть заказ ${order.displayNumber}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <OrdersEyeIcon className="orders-view-btn-icon" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <OrdersDetailModal
        order={selectedOrder}
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onCancelled={() => {
          void fetchOrders();
        }}
      />
    </section>
  );
};

export default Orders;
