import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import { defaultRouteByRole } from '../../app/navigation';
import type { ReminderApi, ReminderListFilter, UserRole } from '../../types';
import {
  NotificationCheckIcon,
  NotificationClockIcon,
  NotificationCloseIcon,
  NotificationProfileIcon,
} from './NotificationsCenterIcons';
import './NotificationsCenter.css';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

const filterTabs: Array<{ value: ReminderListFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'completed', label: 'Выполненные' },
  { value: 'pending', label: 'Невыполненные' },
];

const getClientDisplayName = (name: string | null, id: number) => name?.trim() || `Клиент #${id}`;

const formatReminderDateTime = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bishkek',
  }).format(new Date(value));

const clientsPathByRole = (role: UserRole) => {
  const base = defaultRouteByRole[role].replace(/\/pos$/, '/clients');
  return base;
};

const NotificationsCenter = ({ isOpen, onClose, onChanged }: NotificationsCenterProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [filter, setFilter] = useState<ReminderListFilter>('all');
  const [reminders, setReminders] = useState<ReminderApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const fetchReminders = useCallback(async (activeFilter: ReminderListFilter) => {
    setIsLoading(true);

    try {
      const { data } = await axiosApi.get<ReminderApi[]>('/reminders', {
        params: { filter: activeFilter },
      });
      setReminders(Array.isArray(data) ? data : []);
    } catch {
      setReminders([]);
      toast.error('Не удалось загрузить уведомления');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void fetchReminders(filter);
  }, [isOpen, filter, fetchReminders]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleComplete = async (reminderId: number) => {
    setPendingActionId(reminderId);

    try {
      await axiosApi.patch(`/reminders/${reminderId}/complete`);
      toast.success('Отмечено выполненным');
      await fetchReminders(filter);
      onChanged?.();
    } catch {
      toast.error('Не удалось отметить напоминание');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (reminderId: number) => {
    setPendingActionId(reminderId);

    try {
      await axiosApi.delete(`/reminders/${reminderId}`);
      toast.success('Напоминание удалено');
      await fetchReminders(filter);
      onChanged?.();
    } catch {
      toast.error('Не удалось удалить напоминание');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleOpenProfile = (clientId: number) => {
    if (!session) {
      return;
    }

    const clientsPath = clientsPathByRole(session.user.role);
    onClose();
    navigate(`${clientsPath}?clientId=${clientId}`);
  };

  return (
    <div className="notifications-center-overlay" role="presentation" onClick={onClose}>
      <div
        className="notifications-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-center-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notifications-center-header">
          <h2 id="notifications-center-title" className="notifications-center-title">
            Центр уведомлений
          </h2>
          <button
            type="button"
            className="notifications-center-close-btn"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <NotificationCloseIcon className="notifications-center-close-icon" />
          </button>
        </div>

        <div className="notifications-center-filters" role="tablist" aria-label="Фильтр уведомлений">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filter === tab.value}
              className={`notifications-center-filter-btn${filter === tab.value ? ' is-active' : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="notifications-center-list">
          {isLoading ? (
            <p className="notifications-center-empty">Загрузка...</p>
          ) : reminders.length === 0 ? (
            <p className="notifications-center-empty">Нет уведомлений</p>
          ) : (
            reminders.map((reminder) => {
              const isBusy = pendingActionId === reminder.id;
              const clientName = getClientDisplayName(reminder.client.name, reminder.client.id);

              return (
                <article
                  key={reminder.id}
                  className={`notifications-center-card${reminder.isCompleted ? ' is-completed' : ''}`}
                >
                  <div className="notifications-center-card-top">
                    <div className="notifications-center-card-type">
                      <span className="notifications-center-card-type-icon-wrap">
                        <NotificationClockIcon className="notifications-center-card-type-icon" />
                      </span>
                      <div className="notifications-center-card-meta">
                        <span className="notifications-center-card-type-label">НАПОМИНАНИЕ</span>
                        <time className="notifications-center-card-time" dateTime={reminder.remindAt}>
                          {formatReminderDateTime(reminder.remindAt)}
                        </time>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="notifications-center-card-delete-btn"
                      aria-label="Удалить напоминание"
                      onClick={() => {
                        void handleDelete(reminder.id);
                      }}
                      disabled={isBusy}
                    >
                      <NotificationCloseIcon className="notifications-center-card-delete-icon" />
                    </button>
                  </div>

                  <div className="notifications-center-card-body">
                    <div className="notifications-center-card-identity">
                      <p className="notifications-center-card-name">{clientName}</p>
                      <p className="notifications-center-card-phone">{reminder.client.phone}</p>
                    </div>
                    <p className="notifications-center-card-note">{reminder.note}</p>
                  </div>

                  <div className="notifications-center-card-actions">
                    <button
                      type="button"
                      className="notifications-center-action-btn"
                      onClick={() => handleOpenProfile(reminder.clientId)}
                      disabled={isBusy}
                    >
                      <NotificationProfileIcon className="notifications-center-action-icon" />
                      Профиль
                    </button>

                    {reminder.isCompleted ? (
                      <button type="button" className="notifications-center-action-btn is-done" disabled>
                        <NotificationCheckIcon className="notifications-center-action-icon" />
                        Выполнено
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="notifications-center-action-btn is-mark"
                        onClick={() => {
                          void handleComplete(reminder.id);
                        }}
                        disabled={isBusy}
                      >
                        <NotificationCheckIcon className="notifications-center-action-icon" />
                        Отметить
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsCenter;
