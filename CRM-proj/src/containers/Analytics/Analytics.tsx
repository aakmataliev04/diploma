import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import type { AnalyticsApiPeriod, AnalyticsChartPointApi, AnalyticsResponse, AnalyticsSourceApi } from '../../types';
import {
  AnalyticsFlowersIcon,
  AnalyticsSourceIcon,
  AverageCheckIcon,
  DecreaseIcon,
  IncreaseIcon,
  InstagramSourceIcon,
  NewClientsIcon,
  OrdersIcon,
  ProfitIcon,
  TelegramSourceIcon,
  RevenueIcon,
  TopBouquetsIcon,
  TwoGisSourceIcon,
  WhatsAppSourceIcon,
} from './components/AnalyticsIcons/AnalyticsIcons';
import './Analytics.css';

type AnalyticsPeriod = 'Сегодня' | 'Неделя' | 'Месяц' | 'Год' | 'Выбрать период';
type TrendType = 'increase' | 'decrease';

const periods: AnalyticsPeriod[] = ['Сегодня', 'Неделя', 'Месяц', 'Год', 'Выбрать период'];

const periodToApi: Record<AnalyticsPeriod, AnalyticsApiPeriod> = {
  Сегодня: 'today',
  Неделя: 'week',
  Месяц: 'month',
  Год: 'year',
  'Выбрать период': 'custom',
};

const emptyAnalyticsData: AnalyticsResponse = {
  period: 'month',
  summary: {
    revenue: 0,
    profit: 0,
    ordersCount: 0,
    averageCheck: 0,
    newClients: 0,
    trends: {
      revenue: 0,
      profit: 0,
      ordersCount: 0,
      averageCheck: 0,
      newClients: 0,
    },
  },
  chart: [],
  topBouquets: [],
  flowers: [],
  sources: [],
};

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
const formatMoney = (value: number) => `${formatNumber(value)} KGS`;
const formatCompactValue = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
  }).format(value);
const formatCompactMoney = (value: number) => `${formatCompactValue(value)} KGS`;
const formatTrend = (value: number) => `${value > 0 ? '+' : ''}${value}%`;
const getTrendType = (value: number): TrendType => (value < 0 ? 'decrease' : 'increase');
const getSafeNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const getInputDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getInitialCustomStartDate = () => {
  const today = new Date();
  return getInputDateValue(new Date(today.getFullYear(), today.getMonth(), 1));
};

const getInitialCustomEndDate = () => getInputDateValue(new Date());

const formatChartAxisValue = (value: number) => `${Math.round(value / 1000)}k`;

const getSourceChannelIcon = (sourceName: string, fallbackIcon: string) => {
  const normalizedSource = sourceName.toLowerCase().replace(/\s/g, '');

  if (normalizedSource.includes('whatsapp')) {
    return <WhatsAppSourceIcon />;
  }

  if (normalizedSource.includes('telegram')) {
    return <TelegramSourceIcon />;
  }

  if (normalizedSource.includes('instagram')) {
    return <InstagramSourceIcon />;
  }

  if (normalizedSource.includes('2gis') || normalizedSource.includes('2гис')) {
    return <TwoGisSourceIcon />;
  }

  return fallbackIcon;
};

const useElementSize = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return {
    ref,
    width: size.width,
    height: size.height,
    isReady: size.width > 0 && size.height > 0,
  };
};

const AnalyticsChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AnalyticsChartPointApi }>;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="analytics-chart-tooltip">
      <strong>{point.date}</strong>
      <span><i className="analytics-tooltip-dot analytics-tooltip-dot-orders" />Заказы: <b>{formatNumber(point.ordersCount)} шт</b></span>
      <span><i className="analytics-tooltip-dot analytics-tooltip-dot-pink" />Оборот: <b>{formatMoney(point.revenue)}</b></span>
      <span><i className="analytics-tooltip-dot analytics-tooltip-dot-purple" />Прибыль: <b>{formatMoney(point.profit)}</b></span>
    </div>
  );
};

const AnalyticsSourceTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AnalyticsSourceApi }>;
}) => {
  if (!active || !payload?.length || payload[0].payload.name === 'Нет заказов') {
    return null;
  }

  const source = payload[0].payload;

  return (
    <div className="analytics-sourse-tooltip">
      <span>{source.name}:</span>
      <strong>{formatNumber(source.amount)} заказов</strong>
    </div>
  );
};

const normalizeAnalyticsData = (data: AnalyticsResponse): AnalyticsResponse => ({
  ...data,
  summary: {
    revenue: getSafeNumber(data.summary?.revenue),
    profit: getSafeNumber(data.summary?.profit),
    ordersCount: getSafeNumber(data.summary?.ordersCount),
    averageCheck: getSafeNumber(data.summary?.averageCheck),
    newClients: getSafeNumber(data.summary?.newClients),
    trends: {
      revenue: getSafeNumber(data.summary?.trends?.revenue),
      profit: getSafeNumber(data.summary?.trends?.profit),
      ordersCount: getSafeNumber(data.summary?.trends?.ordersCount),
      averageCheck: getSafeNumber(data.summary?.trends?.averageCheck),
      newClients: getSafeNumber(data.summary?.trends?.newClients),
    },
  },
  chart: Array.isArray(data.chart)
    ? data.chart.map((point) => ({
        ...point,
        ordersCount: getSafeNumber(point.ordersCount),
        revenue: getSafeNumber(point.revenue),
        profit: getSafeNumber(point.profit),
      }))
    : [],
  topBouquets: Array.isArray(data.topBouquets)
    ? data.topBouquets.map((bouquet) => ({
        ...bouquet,
        revenue: getSafeNumber(bouquet.revenue),
        amount: getSafeNumber(bouquet.amount),
        progress: getSafeNumber(bouquet.progress),
      }))
    : [],
  flowers: Array.isArray(data.flowers)
    ? data.flowers.map((flower) => ({
        ...flower,
        amount: getSafeNumber(flower.amount),
        progress: getSafeNumber(flower.progress),
      }))
    : [],
  sources: Array.isArray(data.sources)
    ? data.sources.map((source) => ({
        ...source,
        amount: getSafeNumber(source.amount),
        value: getSafeNumber(source.value),
      }))
    : [],
});

const Analytics = () => {
  const { session } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('Месяц');
  const [customStartDate, setCustomStartDate] = useState(getInitialCustomStartDate);
  const [customEndDate, setCustomEndDate] = useState(getInitialCustomEndDate);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse>(emptyAnalyticsData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const financialChartContainer = useElementSize<HTMLDivElement>();
  const sourceDonutContainer = useElementSize<HTMLDivElement>();
  const financialChartWidth = Math.max(financialChartContainer.width, 640);
  const sourceDonutWidth = Math.max(sourceDonutContainer.width, 144);
  const sourceDonutHeight = Math.max(sourceDonutContainer.height, 144);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;

    const fetchAnalytics = async () => {
      if (selectedPeriod === 'Выбрать период' && customStartDate > customEndDate) {
        setIsLoading(false);
        setErrorMessage('Дата начала периода не может быть позже даты окончания.');
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');

        const params =
          selectedPeriod === 'Выбрать период'
            ? { period: periodToApi[selectedPeriod], startDate: customStartDate, endDate: customEndDate }
            : { period: periodToApi[selectedPeriod] };

        const { data } = await axiosApi.get<AnalyticsResponse>('/analytics', {
          params,
        });

        if (isMounted) {
          setAnalyticsData(normalizeAnalyticsData(data));
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Не удалось загрузить аналитику. Проверь подключение к серверу.');
          setAnalyticsData(emptyAnalyticsData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [customEndDate, customStartDate, selectedPeriod, session]);

  const { summary, chart, topBouquets, flowers, sources } = analyticsData;
  const analyticsCards = [
    {
      title: 'Чистая прибыль',
      value: formatCompactMoney(summary.profit),
      trend: summary.trends.profit,
      Icon: ProfitIcon,
      iconClassName: 'analytics-info-card-icon analytics-info-card-icon-profit',
    },
    {
      title: 'Количество чеков',
      value: formatCompactValue(summary.ordersCount),
      trend: summary.trends.ordersCount,
      Icon: OrdersIcon,
      iconClassName: 'analytics-info-card-icon analytics-info-card-icon-orders',
    },
    {
      title: 'Средний чек',
      value: formatMoney(summary.averageCheck),
      trend: summary.trends.averageCheck,
      Icon: AverageCheckIcon,
      iconClassName: 'analytics-info-card-icon analytics-info-card-icon-average',
    },
    {
      title: 'Новых клиентов',
      value: formatCompactValue(summary.newClients),
      trend: summary.trends.newClients,
      Icon: NewClientsIcon,
      iconClassName: 'analytics-info-card-icon analytics-info-card-icon-clients',
    },
  ];

  const hasSourceOrders = sources.some((source) => source.amount > 0);
  const sourceChartData = hasSourceOrders
    ? sources
    : [{ name: 'Нет заказов', amount: 1, value: 100, color: '#E2E2E8', icon: '0' }];

  return (
    <section className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1 className="analytics-title">Управленческая аналитика</h1>
          <p className="analytics-subtitle">Финансы, товары и маркетинг</p>
        </div>

        <div className="analytics-periods" aria-label="Выбор периода аналитики">
          {periods.map((period) => (
            <button
              type="button"
              key={period}
              className={`analytics-period-btn${selectedPeriod === period ? ' analytics-period-btn-active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      {selectedPeriod === 'Выбрать период' && (
        <div className="analytics-custom-period">
          <label className="analytics-custom-period-field">
            <span>ОТ</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
            />
          </label>
          <label className="analytics-custom-period-field">
            <span>ДО</span>
            <input
              type="date"
              value={customEndDate}
              min={customStartDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
            />
          </label>
        </div>
      )}

      {errorMessage && <p className="analytics-status analytics-status-error">{errorMessage}</p>}
      {isLoading && <p className="analytics-status">Загружаем аналитику...</p>}

      <div className="analytics-info">
        <article className="analytics-info-card-revenue">
          <div className="analytics-info-card-top">
            <span className="analytics-info-card-revenue-icon">
              <RevenueIcon />
            </span>
            <span className={`analytics-trend analytics-trend-${getTrendType(summary.trends.revenue)}`}>
              {getTrendType(summary.trends.revenue) === 'increase' ? <IncreaseIcon /> : <DecreaseIcon />}
              {formatTrend(summary.trends.revenue)}
            </span>
          </div>
          <p className="analytics-info-card-revenue-title">Общая выручка</p>
          <strong className="analytics-info-card-revenue-value">{formatCompactMoney(summary.revenue)}</strong>
        </article>

        {analyticsCards.map(({ title, value, trend, Icon, iconClassName }) => {
          const trendType = getTrendType(trend);

          return (
            <article className="analytics-info-card" key={title}>
              <div className="analytics-info-card-top">
                <span className={iconClassName}>
                  <Icon />
                </span>
                <span className={`analytics-trend analytics-trend-${trendType}`}>
                  {trendType === 'increase' ? <IncreaseIcon /> : <DecreaseIcon />}
                  {formatTrend(trend)}
                </span>
              </div>
              <p className="analytics-info-card-title">{title}</p>
              <strong className="analytics-info-card-value">{value}</strong>
            </article>
          );
        })}
      </div>

      <div className="analytics-main-grid">
        <article className="analytics-financial-summary-graph">
          <div className="analytics-card-heading">
            <h2 className="analytics-card-title">Финансовая сводка</h2>
            <p className="analytics-card-subtitle">Динамика выручки и прибыли за выбранный период</p>
          </div>

          <div ref={financialChartContainer.ref} className="analytics-chart-wrap" aria-label="График финансовой сводки">
            {financialChartContainer.isReady ? (
              <div className="analytics-chart-canvas" style={{ width: `${financialChartWidth}px`, height: '285px' }}>
                <AreaChart
                  width={financialChartWidth}
                  height={285}
                  data={chart}
                  margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="analytics-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A5D9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A5D9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analytics-profit-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B9D" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF6B9D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(0, 0, 0, 0.05)" strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a0a0ab', fontSize: 11, fontWeight: 500 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a0a0ab', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={formatChartAxisValue}
                    width={44}
                  />
                  <Tooltip
                    content={<AnalyticsChartTooltip />}
                    cursor={{ stroke: 'rgba(0, 0, 0, 0.10)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D4A5D9"
                    strokeWidth={3}
                    fill="url(#analytics-revenue-fill)"
                    activeDot={{ r: 5, fill: '#FF6B9D', stroke: '#fff', strokeWidth: 3 }}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#FF6B9D"
                    strokeWidth={2}
                    fill="url(#analytics-profit-fill)"
                    activeDot={{ r: 4, fill: '#D4A5D9', stroke: '#fff', strokeWidth: 2 }}
                    dot={false}
                  />
                </AreaChart>
              </div>
            ) : null}
          </div>
        </article>

        <article className="analytics-top-bouquets">
          <div className="analytics-top-bouquets-heading">
            <TopBouquetsIcon />
            <div>
              <h2 className="analytics-top-bouquets-title">Топ букетов</h2>
              <p className="analytics-card-subtitle">По выручке за выбранный период</p>
            </div>
          </div>

          <div className="analytics-top-bouquets-list">
            {topBouquets.length === 0 && <p className="analytics-empty-text">Пока нет продаж букетов за период</p>}
            {topBouquets.map((bouquet, index) => (
              <div className="analytics-top-bouquets-element" key={bouquet.name}>
                <div className="analytics-top-bouquets-element-head">
                  <h3 className="analytics-top-bouquets-element-title">
                    {index + 1}. {bouquet.name}
                  </h3>
                  <strong className="analytics-top-bouquets-element-total-finance">{formatMoney(bouquet.revenue)}</strong>
                </div>
                <div className="analytics-top-bouquets-element-progress-track">
                  <span
                    className="analytics-top-bouquets-element-progress"
                    style={{ width: `${bouquet.progress}%` }}
                  />
                </div>
                <p className="analytics-top-bouquets-element-amount">{formatNumber(bouquet.amount)} шт</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="analytics-bottom-grid">
        <article className="analytics-flowers">
          <div className="analytics-section-heading">
            <AnalyticsFlowersIcon />
            <div>
              <h2 className="analytics-flowers-tittle">Аналитика по цветам</h2>
              <p className="analytics-flowers-subtitle">Топ ингредиентов по расходу для закупок</p>
            </div>
          </div>

          <div className="analytics-flowers-list">
            {flowers.length === 0 && <p className="analytics-empty-text">Пока нет расхода цветов за период</p>}
            {flowers.map((flower) => (
              <div className="analytics-flowers-ingredient" key={flower.name}>
                <div className="analytics-flowers-ingredient-meta">
                  <span>{flower.name}</span>
                  <strong>{formatNumber(flower.amount)} шт</strong>
                </div>
                <div className="analytics-flowers-progress-track">
                  <span
                    className="analytics-flowers-progress"
                    style={{ width: `${flower.progress}%`, background: flower.color }}
                  />
                  <span className="analytics-flowers-tooltip">
                    <strong>{flower.name}</strong>
                    <span>Расход: <b>{flower.expense}</b></span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-sourse">
          <div className="analytics-section-heading">
            <AnalyticsSourceIcon />
            <div>
              <h2 className="analytics-sourse-tittle">Источники продаж</h2>
              <p className="analytics-sourse-subtitle">Распределение заказов по каналам</p>
            </div>
          </div>

          <div className="analytics-sourse-content">
            <div className="analytics-sourse-list">
              {sources.map((source) => (
                <div className="analytics-sourse-row" key={source.name}>
                  <span className="analytics-sourse-channel-icon" style={{ background: source.color }}>
                    {getSourceChannelIcon(source.name, source.icon)}
                  </span>
                  <span className="analytics-sourse-name">{source.name}</span>
                  <strong className="analytics-sourse-amount">{formatNumber(source.amount)} шт</strong>
                </div>
              ))}
            </div>

            <div
              ref={sourceDonutContainer.ref}
              className="analytics-sourse-donut"
              aria-label="Диаграмма источников продаж"
            >
              {sourceDonutContainer.isReady ? (
                <PieChart width={sourceDonutWidth} height={sourceDonutHeight} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Tooltip content={<AnalyticsSourceTooltip />} />
                  <Pie
                    data={sourceChartData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={4}
                    stroke="#fff"
                    strokeWidth={5}
                  >
                    {sourceChartData.map((source) => (
                      <Cell key={source.name} fill={source.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Analytics;
