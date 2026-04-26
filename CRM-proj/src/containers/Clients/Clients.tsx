import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import type {
  ClientApi,
  ClientListCardData,
  ClientsInfoCardData,
  ClientsListFilter,
  ClientsListSort,
  ClientsListView,
  UpdateClientPayload,
  UpdateClientResponse,
  UpcomingClientEventData,
} from '../../types';
import {
  ClientCardEditIcon,
  ClientCardEventIcon,
  ClientCardNoEventIcon,
  ClientCardRemindIcon,
  ClientEventIcon,
  ClientPhoneIcon,
  ClientsCardsViewIcon,
  ClientsFilterIcon,
  ClientsSearchIcon,
  ClientsSortIcon,
  ClientsTableViewIcon,
  KnownEventsIcon,
  MessageIcon,
  MissingEventsIcon,
  TotalClientsIcon,
  UpcomingEventsIcon,
} from './components/ClientsIcons/ClientsIcons';
import ClientsEditModal from './components/ClientsEditModal/ClientsEditModal';
import ClientsMessageModal from './components/ClientsMessageModal/ClientsMessageModal';
import ClientsReminderModal from './components/ClientsReminderModal/ClientsReminderModal';
import './Clients.css';

const clientsListFilters: Array<{ value: ClientsListFilter; label: string }> = [
  { value: 'all', label: 'Все клиенты' },
  { value: 'with-events', label: 'С событиями' },
  { value: 'without-events', label: 'Без событий' },
  { value: 'upcoming', label: 'С ближайщими событиями (7д)' },
];

const clientsListSortOptions: Array<{ value: ClientsListSort; label: string }> = [
  { value: 'name', label: 'По имени' },
  { value: 'orders', label: 'По заказам' },
  { value: 'event-date', label: 'По дате события' },
];

const parseClientEventDate = (dateLabel: string) => {
  const months: Record<string, string> = {
    января: '01',
    февраля: '02',
    марта: '03',
    апреля: '04',
    мая: '05',
    июня: '06',
    июля: '07',
    августа: '08',
    сентября: '09',
    октября: '10',
    ноября: '11',
    декабря: '12',
  };

  const match = dateLabel.match(/(\d{2})\s+([а-я]+)\s+(\d{4})/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, day, month, year] = match;
  const monthValue = months[month.toLowerCase()];

  if (!monthValue) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(`${year}-${monthValue}-${day}`).getTime();
};

const formatAbsoluteEventDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bishkek',
  }).format(new Date(value));

const getRelativeEventDate = (value: string) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const eventDate = new Date(value);
  const startOfEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
  const diffDays = Math.round((startOfEventDate - startOfToday) / 86400000);

  if (diffDays === 0) {
    return 'СЕГОДНЯ';
  }

  if (diffDays === 1) {
    return 'ЗАВТРА';
  }

  if (diffDays > 1) {
    return `ЧЕРЕЗ ${diffDays} ДН.`;
  }

  return '';
};

const getLoyaltyProgress = (ordersCount: number) => {
  if (ordersCount <= 0) {
    return 0;
  }

  const remainder = ordersCount % 7;
  return remainder === 0 ? 7 : remainder;
};

const getClientDisplayName = (client: ClientApi) => client.name?.trim() || `Клиент #${client.id}`;

const getInfoCardIcon = (icon: ClientsInfoCardData['icon']) => {
  if (icon === 'clients') {
    return <TotalClientsIcon className="clients-info-card-icon-svg" />;
  }

  if (icon === 'events-known') {
    return <KnownEventsIcon className="clients-info-card-icon-svg" />;
  }

  return <MissingEventsIcon className="clients-info-card-icon-svg" />;
};

const mapClientToListCardData = (client: ClientApi, startOfToday: number, upcomingLimit: number): ClientListCardData => {
  const sortedEvents = [...client.events].sort(
    (leftEvent, rightEvent) => new Date(leftEvent.date).getTime() - new Date(rightEvent.date).getTime(),
  );
  const nearestEvent = sortedEvents[0];

  return {
    id: client.id,
    name: getClientDisplayName(client),
    phone: client.phone,
    totalOrders: client.ordersCount,
    loyaltyCurrent: getLoyaltyProgress(client.ordersCount),
    loyaltyTarget: 7,
    event: nearestEvent
      ? {
          title: nearestEvent.title,
          dateLabel: formatAbsoluteEventDate(nearestEvent.date),
          extraCount: sortedEvents.length > 1 ? sortedEvents.length : undefined,
          hasUpcomingEvent: (() => {
            const nearestEventTime = new Date(nearestEvent.date).getTime();
            return nearestEventTime >= startOfToday && nearestEventTime <= upcomingLimit;
          })(),
        }
      : null,
  };
};

const Clients = () => {
  const { session } = useAuth();
  const isFlorist = session?.user.role === 'FLORIST';
  const [listView, setListView] = useState<ClientsListView>('cards');
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState<ClientsListFilter>('all');
  const [listSort, setListSort] = useState<ClientsListSort>('name');
  const [clients, setClients] = useState<ClientApi[]>([]);
  const [floristUpcomingClients, setFloristUpcomingClients] = useState<ClientApi[]>([]);
  const [floristSearchClients, setFloristSearchClients] = useState<ClientApi[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedMessageClientId, setSelectedMessageClientId] = useState<number | null>(null);
  const [selectedMessageTemplateHint, setSelectedMessageTemplateHint] = useState<string | null>(null);
  const [selectedReminderClientId, setSelectedReminderClientId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminClients = async () => {
      try {
        const { data } = await axiosApi.get<ClientApi[]>('/clients');

        if (isMounted) {
          setClients(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setClients([]);
        }
      }
    };

    const fetchFloristUpcomingClients = async () => {
      try {
        const { data } = await axiosApi.get<ClientApi[]>('/clients/upcoming');

        if (isMounted) {
          setFloristUpcomingClients(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setFloristUpcomingClients([]);
        }
      }
    };

    if (isFlorist) {
      void fetchFloristUpcomingClients();
    } else {
      void fetchAdminClients();
    }

    return () => {
      isMounted = false;
    };
  }, [isFlorist]);

  useEffect(() => {
    if (!isFlorist) {
      return;
    }

    const normalizedQuery = listSearch.trim();

    if (normalizedQuery === '') {
      return;
    }

    let isMounted = true;

    const fetchFloristSearchClients = async () => {
      try {
        const { data } = await axiosApi.get<ClientApi[]>('/clients/search', {
          params: {
            q: normalizedQuery,
          },
        });

        if (isMounted) {
          setFloristSearchClients(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setFloristSearchClients([]);
        }
      }
    };

    void fetchFloristSearchClients();

    return () => {
      isMounted = false;
    };
  }, [isFlorist, listSearch]);

  const clientsInfoCards = useMemo<ClientsInfoCardData[]>(() => {
    const clientsWithEvents = clients.filter((client) => client.events.length > 0).length;

    return [
      { id: 'total', title: 'Всего клиентов', value: clients.length, tone: 'accent', icon: 'clients' },
      { id: 'known-events', title: 'С известными событиями', value: clientsWithEvents, tone: 'accent', icon: 'events-known' },
      {
        id: 'missing-events',
        title: 'Без добавленных событий',
        value: clients.length - clientsWithEvents,
        tone: 'muted',
        icon: 'events-missing',
      },
    ];
  }, [clients]);

  const upcomingEvents = useMemo<UpcomingClientEventData[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcomingLimit = startOfToday + 7 * 86400000;
    const upcomingClientsSource = isFlorist ? floristUpcomingClients : clients;

    const mappedUpcomingEvents: UpcomingClientEventData[] = [];

    upcomingClientsSource.forEach((client) => {
        const upcomingClientEvents = client.events
          .filter((event) => {
            const eventTime = new Date(event.date).getTime();
            return eventTime >= startOfToday && eventTime <= upcomingLimit;
          })
          .sort((leftEvent, rightEvent) => new Date(leftEvent.date).getTime() - new Date(rightEvent.date).getTime());

        if (upcomingClientEvents.length === 0) {
          return;
        }

        const nearestEvent = upcomingClientEvents[0];

        mappedUpcomingEvents.push({
          id: client.id,
          name: getClientDisplayName(client),
          phone: client.phone,
          eventName: nearestEvent.title,
          relativeDate: getRelativeEventDate(nearestEvent.date),
          absoluteDate: formatAbsoluteEventDate(nearestEvent.date),
          extraCount: upcomingClientEvents.length > 1 ? upcomingClientEvents.length - 1 : undefined,
        });
      });

    return mappedUpcomingEvents.sort(
      (leftClient, rightClient) => parseClientEventDate(leftClient.absoluteDate) - parseClientEventDate(rightClient.absoluteDate),
    );
  }, [clients, floristUpcomingClients, isFlorist]);

  const upcomingEventsCount = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcomingLimit = startOfToday + 7 * 86400000;
    const upcomingClientsSource = isFlorist ? floristUpcomingClients : clients;

    return upcomingClientsSource.reduce((total, client) => {
      const upcomingClientEventsCount = client.events.filter((event) => {
        const eventTime = new Date(event.date).getTime();
        return eventTime >= startOfToday && eventTime <= upcomingLimit;
      }).length;

      return total + upcomingClientEventsCount;
    }, 0);
  }, [clients, floristUpcomingClients, isFlorist]);

  const clientsListItems = useMemo<ClientListCardData[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcomingLimit = startOfToday + 7 * 86400000;

    return clients.map((client) => mapClientToListCardData(client, startOfToday, upcomingLimit));
  }, [clients]);

  const normalizedListSearch = listSearch.trim().toLowerCase();
  const allKnownClients = useMemo(() => {
    const mergedClients = [...clients, ...floristUpcomingClients, ...floristSearchClients];
    const uniqueClients = new Map<number, ClientApi>();

    mergedClients.forEach((client) => {
      uniqueClients.set(client.id, client);
    });

    return Array.from(uniqueClients.values());
  }, [clients, floristUpcomingClients, floristSearchClients]);

  const selectedClient = useMemo(
    () => allKnownClients.find((client) => client.id === selectedClientId) ?? null,
    [allKnownClients, selectedClientId],
  );
  const selectedMessageClient = useMemo(
    () => allKnownClients.find((client) => client.id === selectedMessageClientId) ?? null,
    [allKnownClients, selectedMessageClientId],
  );
  const selectedReminderClient = useMemo(
    () => allKnownClients.find((client) => client.id === selectedReminderClientId) ?? null,
    [allKnownClients, selectedReminderClientId],
  );

  const filteredClients = useMemo(() => {
    const searchFilteredItems = clientsListItems.filter((client) => {
      const matchesSearch =
        normalizedListSearch === '' ||
        client.name.toLowerCase().includes(normalizedListSearch) ||
        client.phone.toLowerCase().includes(normalizedListSearch);

      if (!matchesSearch) {
        return false;
      }

      if (listFilter === 'with-events') {
        return Boolean(client.event);
      }

      if (listFilter === 'without-events') {
        return !client.event;
      }

      if (listFilter === 'upcoming') {
        return Boolean(client.event?.hasUpcomingEvent);
      }

      return true;
    });

    return [...searchFilteredItems].sort((leftClient, rightClient) => {
      if (listSort === 'orders') {
        return rightClient.totalOrders - leftClient.totalOrders;
      }

      if (listSort === 'event-date') {
        return parseClientEventDate(leftClient.event?.dateLabel ?? '') - parseClientEventDate(rightClient.event?.dateLabel ?? '');
      }

      return leftClient.name.localeCompare(rightClient.name, 'ru');
    });
  }, [clientsListItems, listFilter, listSort, normalizedListSearch]);

  const floristSearchResults = useMemo<ClientListCardData[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcomingLimit = startOfToday + 7 * 86400000;

    if (normalizedListSearch === '') {
      return [];
    }

    return floristSearchClients
      .map((client) => mapClientToListCardData(client, startOfToday, upcomingLimit))
      .sort((leftClient, rightClient) => leftClient.name.localeCompare(rightClient.name, 'ru'));
  }, [floristSearchClients, normalizedListSearch]);

  const handleClientSave = async (clientId: number, payload: UpdateClientPayload) => {
    const response = await toast.promise(
      axiosApi.put<UpdateClientResponse>(`/clients/${clientId}`, payload),
      {
        pending: 'Сохраняем изменения клиента...',
        success: 'Профиль клиента обновлен.',
        error: 'Не удалось сохранить изменения клиента.',
      },
    );

    const { data } = response;

    setClients((currentClients) =>
      currentClients.map((currentClient) =>
        currentClient.id === clientId ? data.client : currentClient,
      ),
    );
    setFloristUpcomingClients((currentClients) =>
      currentClients.map((currentClient) =>
        currentClient.id === clientId ? data.client : currentClient,
      ),
    );
    setFloristSearchClients((currentClients) =>
      currentClients.map((currentClient) =>
        currentClient.id === clientId ? data.client : currentClient,
      ),
    );

    setSelectedClientId(null);
  };

  const openMessageModal = (clientId: number, templateHint?: string | null) => {
    setSelectedMessageClientId(clientId);
    setSelectedMessageTemplateHint(templateHint ?? null);
  };

  const renderClientCard = (client: ClientListCardData) => (
    <article key={client.id} className="clients-list-card">
      <div className="clients-list-card-top">
        <div className="clients-list-card-avatar">
          {client.name.slice(0, 1).toUpperCase()}
        </div>

        <div className="clients-list-card-profile">
          <h3 className="clients-list-card-name">{client.name}</h3>
          <div className="clients-list-card-phone-row">
            <ClientPhoneIcon className="clients-list-card-phone-icon" />
            <span className="clients-list-card-phone">{client.phone}</span>
          </div>
        </div>
      </div>

      <div className="clients-list-card-stats">
        <div className="clients-list-card-orders-row">
          <span className="clients-list-card-orders">Всего заказов</span>
          <span className="clients-list-card-orders-number">{client.totalOrders}</span>
        </div>

        <div className="clients-list-card-progress">
          {Array.from({ length: client.loyaltyTarget }).map((_, index) => (
            <span
              key={`${client.id}-card-progress-${index}`}
              className={
                index < client.loyaltyCurrent
                  ? 'clients-list-card-progress-segment clients-list-card-progress-segment-active'
                  : 'clients-list-card-progress-segment clients-list-card-progress-segment-inactive'
              }
            />
          ))}
        </div>

        <div className="clients-list-card-loyalty-row">
          <span className="clients-list-card-loyalty-tittle">Прогресс лояльности</span>
          <span className="clients-list-card-loyalty-state">
            {client.loyaltyCurrent}/{client.loyaltyTarget}
          </span>
        </div>
      </div>

      <div className="clients-list-card-event-block">
        {client.event ? (
          <>
            <div className="clients-list-card-event-row">
              <div className="clients-list-card-event-main">
                <ClientCardEventIcon className="clients-list-card-event-icon" />
                <span className="clients-list-card-event">{client.event.title}</span>
              </div>
              {client.event.extraCount ? (
                <span className="clients-list-card-event-extra">
                  всего {client.event.extraCount}
                </span>
              ) : null}
            </div>
            <p className="clients-list-card-event-date">{client.event.dateLabel}</p>
          </>
        ) : (
          <div className="clients-list-card-noEvent-row">
            <ClientCardNoEventIcon className="clients-list-card-noEvent-icon" />
            <span className="clients-list-card-noEvent">Нет событий</span>
          </div>
        )}
      </div>

      <div className="clients-list-card-actions">
        <button
          type="button"
          className="clients-list-card-btn clients-list-card-btn-edit"
          onClick={() => setSelectedClientId(client.id)}
        >
          <ClientCardEditIcon className="clients-list-card-btn-icon" />
        </button>
        <button
          type="button"
          className="clients-list-card-btn clients-list-card-btn-message"
          onClick={() => openMessageModal(client.id, client.event?.title)}
        >
          <MessageIcon className="clients-list-card-btn-icon" />
        </button>
        <button
          type="button"
          className="clients-list-card-btn clients-list-card-btn-remind"
          onClick={() => setSelectedReminderClientId(client.id)}
        >
          <ClientCardRemindIcon className="clients-list-card-btn-icon" />
        </button>
      </div>
    </article>
  );

  return (
    <section className="clients-page">
      <div className="clients-info">
        <div className="clients-info-heading">
          <h1 className="clients-info-tittle">Клиентская база</h1>
          <p className="clients-info-subTittle">
            Управление профилями, лояльностью и событиями клиентов
          </p>
        </div>

        {!isFlorist ? (
          <div className="clients-info-cards">
            {clientsInfoCards.map((card) => (
              <article key={card.id} className="clients-info-card">
                <div
                  className={
                    card.tone === 'accent'
                      ? 'clients-info-card-icon clients-info-card-icon-accent'
                      : 'clients-info-card-icon clients-info-card-icon-muted'
                  }
                >
                  {getInfoCardIcon(card.icon)}
                </div>
                <div className="clients-info-card-content">
                  <p className="clients-info-card-tittle">{card.title}</p>
                  <p className="clients-info-card-number">{card.value}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      {isFlorist ? (
        <section className="clients-list">
          <div className="clients-search-heading">
            <h2 className="clients-list-tittle">Поиск клиентов</h2>
            <p className="clients-search-subtitle">Найдите профиль клиента для оформления заказа</p>
          </div>

          <div className="clients-list-toolbar clients-list-toolbar-search-only">
            <label className="clients-list-search">
              <ClientsSearchIcon className="clients-list-search-icon" />
              <input
                type="text"
                className="clients-list-search-input"
                placeholder="Поиск по имени или телефону..."
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="clients-search-results">
            {normalizedListSearch ? (
              floristSearchResults.length > 0 ? (
                <div className="clients-list-cards clients-list-cards-search-only">
                  {floristSearchResults.map(renderClientCard)}
                </div>
              ) : (
                <div className="clients-list-empty">Клиенты по этому запросу не найдены.</div>
              )
            ) : (
              <div className="clients-list-empty clients-list-empty-idle">
                Введите номер или имя для поиска клиентов.
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="next-events">
        <div className="next-events-header">
          <div className="next-events-heading">
            <div className="next-events-title-wrap">
              <UpcomingEventsIcon className="next-events-title-icon" />
              <h2 className="next-events-tittle">Ближайшие события CRM</h2>
            </div>
            <p className="next-events-subTittle">
              Приоритетные клиенты с событиями в ближайшие 7 дней
            </p>
          </div>

          <span className="next-events-count">
            {upcomingEventsCount} {upcomingEventsCount === 1 ? 'событие' : 'событий'}
          </span>
        </div>

        <div className="next-events-list">
          {upcomingEvents.map((client) => (
            <article key={client.id} className="next-events-client">
              <div className="next-events-client-main">
                <div className="next-events-client-avatar">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>

                <div className="next-events-client-profile">
                  <h3 className="next-events-client-name">{client.name}</h3>
                  <div className="next-events-client-phone-row">
                    <ClientPhoneIcon className="next-events-client-phone-icon" />
                    <span className="next-events-client-phone">{client.phone}</span>
                  </div>
                </div>
              </div>

              <div className="next-events-client-event-block">
                <div className="next-events-client-event-line">
                  <ClientEventIcon className="next-events-client-event-icon" />
                  <span className="next-events-client-event">{client.eventName}</span>
                  <span className="next-events-client-dateRelative">{client.relativeDate}</span>
                </div>
                <p className="next-events-client-dateAbsolute">
                  {client.absoluteDate}
                  {client.extraCount ? ` · еще ${client.extraCount}` : ''}
                </p>
              </div>

              <div className="next-events-client-actions">
                <button
                  type="button"
                  className="next-events-client-message-btn"
                  onClick={() => openMessageModal(client.id, client.eventName)}
                >
                  <MessageIcon className="next-events-client-message-icon" />
                  Написать
                </button>
                <button
                  type="button"
                  className="next-events-client-remind-btn"
                  aria-label="Создать напоминание"
                  onClick={() => setSelectedReminderClientId(client.id)}
                >
                  <ClientCardRemindIcon className="next-events-client-remind-icon" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="clients-list">
        {!isFlorist ? (
          <>
            <div className="clients-list-header">
              <h2 className="clients-list-tittle">Общий список клиентов</h2>

              <div className="clients-list-view">
                <button
                  type="button"
                  className={
                    listView === 'cards'
                      ? 'clients-list-view-btn clients-list-view-cards'
                      : 'clients-list-view-btn clients-list-view-list'
                  }
                  onClick={() => setListView('cards')}
                >
                  <ClientsCardsViewIcon className="clients-list-view-icon" />
                  Карточки
                </button>
                <button
                  type="button"
                  className={
                    listView === 'list'
                      ? 'clients-list-view-btn clients-list-view-cards'
                      : 'clients-list-view-btn clients-list-view-list'
                  }
                  onClick={() => setListView('list')}
                >
                  <ClientsTableViewIcon className="clients-list-view-icon" />
                  Таблица
                </button>
              </div>
            </div>

            <div className="clients-list-toolbar">
              <label className="clients-list-search">
                <ClientsSearchIcon className="clients-list-search-icon" />
                <input
                  type="text"
                  className="clients-list-search-input"
                  placeholder="Поиск по имени или телефону..."
                  value={listSearch}
                  onChange={(event) => setListSearch(event.target.value)}
                />
              </label>

              <label className="clients-list-select">
                <ClientsFilterIcon className="clients-list-select-icon" />
                <select
                  className="clients-list-select-field"
                  value={listFilter}
                  onChange={(event) => setListFilter(event.target.value as ClientsListFilter)}
                >
                  {clientsListFilters.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="clients-list-select">
                <ClientsSortIcon className="clients-list-select-icon" />
                <select
                  className="clients-list-select-field"
                  value={listSort}
                  onChange={(event) => setListSort(event.target.value as ClientsListSort)}
                >
                  {clientsListSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {`Сортировка: ${option.label}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {listView === 'cards' ? (
              <div className="clients-list-cards">
                {filteredClients.map(renderClientCard)}
              </div>
            ) : (
              <div className="clients-list-table">
            <div className="clients-list-table-header">
              <span className="clients-list-table-col clients-list-table-col-client">Клиент</span>
              <span className="clients-list-table-col clients-list-table-col-loyalty">Лояльность</span>
              <span className="clients-list-table-col clients-list-table-col-event">События</span>
              <span className="clients-list-table-col clients-list-table-col-actions">Действия</span>
            </div>

            <div className="clients-list-table-body">
              {filteredClients.map((client) => (
                <article key={client.id} className="clients-list-table-row">
                  <div className="clients-list-table-cell clients-list-table-col-client">
                    <div className="clients-list-table-profile">
                      <div className="clients-list-table-avatar">
                        {client.name.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="clients-list-table-profile-text">
                        <h3 className="clients-list-table-name">{client.name}</h3>
                        <div className="clients-list-table-phone-row">
                          <ClientPhoneIcon className="clients-list-table-phone-icon" />
                          <span className="clients-list-table-phone">{client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="clients-list-table-cell clients-list-table-col-loyalty">
                    <div className="clients-list-table-loyalty">
                      <div className="clients-list-table-orders-line">
                        <span className="clients-list-table-orders-number">{client.totalOrders} заказов</span>
                      </div>

                      <div className="clients-list-table-progress-row">
                        {Array.from({ length: client.loyaltyTarget }).map((_, index) => (
                          <span
                            key={`${client.id}-${index}`}
                            className={
                              index < client.loyaltyCurrent
                                ? 'clients-list-table-progress-segment clients-list-table-progress-segment-active'
                                : 'clients-list-table-progress-segment clients-list-table-progress-segment-inactive'
                            }
                          />
                        ))}
                      </div>

                      <div className="clients-list-table-loyalty-row">
                        <span className="clients-list-table-loyalty-label">Прогресс лояльности</span>
                        <span className="clients-list-table-loyalty-state">
                          {client.loyaltyCurrent}/{client.loyaltyTarget}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="clients-list-table-cell clients-list-table-col-event">
                    {client.event ? (
                      <div className="clients-list-table-event">
                        <div className="clients-list-table-event-main">
                          <ClientCardEventIcon className="clients-list-table-event-icon" />
                          <span className="clients-list-table-event-title">{client.event.title}</span>
                        </div>
                        <div className="clients-list-table-event-meta">
                          <span className="clients-list-table-event-date">{client.event.dateLabel}</span>
                          {client.event.extraCount ? (
                            <span className="clients-list-table-event-extra">еще {client.event.extraCount}</span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="clients-list-table-no-event">
                        <ClientCardNoEventIcon className="clients-list-table-no-event-icon" />
                        <span className="clients-list-table-no-event-text">Нет событий</span>
                      </div>
                    )}
                  </div>

                  <div className="clients-list-table-cell clients-list-table-col-actions">
                    <div className="clients-list-table-actions">
                      <button
                        type="button"
                        className="clients-list-table-btn clients-list-table-btn-edit"
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <ClientCardEditIcon className="clients-list-table-btn-icon" />
                      </button>
                      <button
                        type="button"
                        className="clients-list-table-btn clients-list-table-btn-message"
                        onClick={() => openMessageModal(client.id, client.event?.title)}
                      >
                        <MessageIcon className="clients-list-table-btn-icon" />
                      </button>
                      <button
                        type="button"
                        className="clients-list-table-btn clients-list-table-btn-remind"
                        onClick={() => setSelectedReminderClientId(client.id)}
                      >
                        <ClientCardRemindIcon className="clients-list-table-btn-icon" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
            )}
          </>
        ) : null}

        <ClientsEditModal
          key={selectedClient?.id ?? 'clients-edit-modal'}
          client={selectedClient}
          isOpen={selectedClient !== null}
          onClose={() => setSelectedClientId(null)}
          onSave={handleClientSave}
        />

        <ClientsMessageModal
          key={`${selectedMessageClient?.id ?? 'clients-message-modal'}-${selectedMessageTemplateHint ?? 'default'}`}
          clientName={selectedMessageClient ? getClientDisplayName(selectedMessageClient) : ''}
          clientPhone={selectedMessageClient?.phone ?? ''}
          isOpen={selectedMessageClient !== null}
          templateHint={selectedMessageTemplateHint}
          onClose={() => {
            setSelectedMessageClientId(null);
            setSelectedMessageTemplateHint(null);
          }}
        />

        <ClientsReminderModal
          key={selectedReminderClient?.id ?? 'clients-reminder-modal'}
          clientName={selectedReminderClient ? getClientDisplayName(selectedReminderClient) : ''}
          isOpen={selectedReminderClient !== null}
          onClose={() => setSelectedReminderClientId(null)}
        />
      </section>
    </section>
  );
};

export default Clients;
