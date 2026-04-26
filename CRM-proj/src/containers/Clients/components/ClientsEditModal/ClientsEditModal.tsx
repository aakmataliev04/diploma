import { useState } from 'react';
import type {
  ClientApi,
  ClientEditModalEventDraft,
  UpdateClientPayload,
} from '../../../../types';
import {
  ClientModalCloseIcon,
  ClientModalDeleteEventIcon,
} from '../ClientsIcons/ClientsIcons';
import './ClientsEditModal.css';

interface ClientsEditModalProps {
  client: ClientApi | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientId: number, payload: UpdateClientPayload) => Promise<void>;
}

const formatDateToInputValue = (value: string) => {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Bishkek',
  });

  return formatter.format(date);
};

const createEventDrafts = (client: ClientApi | null): ClientEditModalEventDraft[] =>
  client?.events.map((event) => ({
    id: event.id,
    title: event.title,
    date: formatDateToInputValue(event.date),
  })) ?? [];

const ClientsEditModal = ({ client, isOpen, onClose, onSave }: ClientsEditModalProps) => {
  const initialClientName = client?.name?.trim() || '';
  const initialClientPhone = client?.phone || '';
  const initialEvents = createEventDrafts(client);

  const [clientName, setClientName] = useState(initialClientName);
  const [clientPhone, setClientPhone] = useState(initialClientPhone);
  const [events, setEvents] = useState<ClientEditModalEventDraft[]>(initialEvents);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !client) {
    return null;
  }

  const handleDeleteEvent = (eventId: number | string) => {
    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
  };

  const handleAddEvent = () => {
    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: `draft-${Date.now()}`,
        title: '',
        date: '',
      },
    ]);
  };

  const handleEventChange = (
    eventId: number | string,
    field: keyof Pick<ClientEditModalEventDraft, 'title' | 'date'>,
    value: string,
  ) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              [field]: value,
            }
          : event,
      ),
    );
  };

  const handleSubmit = async () => {
    const normalizedPhone = clientPhone.trim();
    const normalizedName = clientName.trim();
    const hasInvalidEvent = events.some((event) => event.title.trim() === '' || event.date.trim() === '');

    if (!normalizedPhone) {
      setErrorMessage('Телефон клиента обязателен.');
      return;
    }

    if (hasInvalidEvent) {
      setErrorMessage('Заполни название и дату события или удали пустую строку.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await onSave(client.id, {
        name: normalizedName || null,
        phone: normalizedPhone,
        events: events.map((event) => ({
          title: event.title.trim(),
          date: event.date,
        })),
      });
    } catch (error) {
      const fallbackMessage = 'Не удалось сохранить изменения клиента.';
      const apiMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'string'
          ? error.response.data.error
          : fallbackMessage;

      setErrorMessage(apiMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="clients-edit-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="clients-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clients-edit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="clients-edit-modal-header">
          <h2 id="clients-edit-modal-title" className="clients-edit-modal-title">
            Редактирование профиля
          </h2>

          <button
            type="button"
            className="clients-edit-modal-close-btn"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <ClientModalCloseIcon className="clients-edit-modal-close-icon" />
          </button>
        </div>

        <div className="clients-edit-modal-body">
          <div className="clients-edit-modal-field">
            <label className="clients-edit-modal-label" htmlFor="clients-edit-name">
              Имя клиента
            </label>
            <input
              id="clients-edit-name"
              type="text"
              className="clients-edit-modal-input"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            />
          </div>

          <div className="clients-edit-modal-field">
            <label className="clients-edit-modal-label" htmlFor="clients-edit-phone">
              Телефон
            </label>
            <input
              id="clients-edit-phone"
              type="text"
              className="clients-edit-modal-input"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
            />
          </div>

          <div className="clients-edit-modal-field">
            <span className="clients-edit-modal-label">События клиента</span>

            <div className="clients-edit-modal-events">
              {events.map((event) => (
                <div key={event.id} className="clients-edit-modal-event-card">
                  <div className="clients-edit-modal-event-content">
                    <input
                      type="text"
                      className="clients-edit-modal-event-input"
                      placeholder="Название события"
                      value={event.title}
                      onChange={(inputEvent) => handleEventChange(event.id, 'title', inputEvent.target.value)}
                    />
                    <input
                      type="date"
                      className="clients-edit-modal-event-input clients-edit-modal-event-date-input"
                      value={event.date}
                      onChange={(inputEvent) => handleEventChange(event.id, 'date', inputEvent.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="clients-edit-modal-event-delete-btn"
                    aria-label="Удалить событие"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <ClientModalDeleteEventIcon className="clients-edit-modal-event-delete-icon" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="clients-edit-modal-add-event-btn"
                onClick={handleAddEvent}
              >
                + Добавить событие
              </button>
            </div>
          </div>

          {errorMessage ? (
            <p className="clients-edit-modal-error-message">{errorMessage}</p>
          ) : null}
        </div>

        <div className="clients-edit-modal-footer">
          <button type="button" className="clients-edit-modal-footer-btn clients-edit-modal-cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="clients-edit-modal-footer-btn clients-edit-modal-save-btn"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsEditModal;
