import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { axiosApi } from '../../../../axiosApi';
import type { CreateReminderPayload, CreateReminderResponse } from '../../../../types';
import {
  ClientCardRemindIcon,
  ClientModalCloseIcon,
} from '../ClientsIcons/ClientsIcons';
import './ClientsReminderModal.css';

interface ClientsReminderModalProps {
  clientId: number | null;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ClientsReminderModal = ({
  clientId,
  clientName,
  isOpen,
  onClose,
  onCreated,
}: ClientsReminderModalProps) => {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDateValue('');
    setTimeValue('');
    setNoteValue('');
    setIsSubmitting(false);
  }, [isOpen, clientId]);

  if (!isOpen) {
    return null;
  }

  const canSubmit =
    Boolean(clientId) &&
    Boolean(dateValue) &&
    Boolean(timeValue) &&
    noteValue.trim().length > 0 &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error('Клиент не выбран.');
      return;
    }

    if (!dateValue || !timeValue) {
      toast.error('Укажи дату и время напоминания.');
      return;
    }

    if (!noteValue.trim()) {
      toast.error('Добавь заметку к напоминанию.');
      return;
    }

    const payload: CreateReminderPayload = {
      clientId,
      date: dateValue,
      time: timeValue,
      note: noteValue.trim(),
    };

    setIsSubmitting(true);

    try {
      await axiosApi.post<CreateReminderResponse>('/reminders', payload);
      toast.success('Напоминание установлено');
      onCreated?.();
      onClose();
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Не удалось создать напоминание';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clients-reminder-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="clients-reminder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clients-reminder-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="clients-reminder-modal-header">
          <div className="clients-reminder-modal-title-wrap">
            <span className="clients-reminder-modal-icon-wrap">
              <ClientCardRemindIcon className="clients-reminder-modal-title-icon" />
            </span>
            <h2 id="clients-reminder-modal-title" className="clients-reminder-modal-title">
              Создать напоминание
            </h2>
          </div>

          <button
            type="button"
            className="clients-reminder-modal-close-btn"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <ClientModalCloseIcon className="clients-reminder-modal-close-icon" />
          </button>
        </div>

        <div className="clients-reminder-modal-body">
          <div className="clients-reminder-modal-field">
            <label className="clients-reminder-modal-label" htmlFor="clients-reminder-client">
              Клиент
            </label>
            <input
              id="clients-reminder-client"
              type="text"
              className="clients-reminder-modal-input"
              value={clientName}
              readOnly
            />
          </div>

          <div className="clients-reminder-modal-date-time">
            <div className="clients-reminder-modal-field clients-reminder-modal-date-field">
              <label className="clients-reminder-modal-label" htmlFor="clients-reminder-date">
                Дата
              </label>
              <div className="clients-reminder-modal-input-wrap">
                <input
                  id="clients-reminder-date"
                  type="date"
                  className="clients-reminder-modal-input clients-reminder-modal-date-input"
                  value={dateValue}
                  onChange={(event) => setDateValue(event.target.value)}
                />
              </div>
            </div>

            <div className="clients-reminder-modal-field clients-reminder-modal-time-field">
              <label className="clients-reminder-modal-label" htmlFor="clients-reminder-time">
                Время
              </label>
              <div className="clients-reminder-modal-input-wrap">
                <input
                  id="clients-reminder-time"
                  type="time"
                  className="clients-reminder-modal-input clients-reminder-modal-time-input"
                  value={timeValue}
                  onChange={(event) => setTimeValue(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="clients-reminder-modal-field">
            <label className="clients-reminder-modal-label" htmlFor="clients-reminder-note">
              Заметка
            </label>
            <textarea
              id="clients-reminder-note"
              className="clients-reminder-modal-textarea"
              placeholder="Например: Позвонить и предложить букет из пионов..."
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
            />
          </div>
        </div>

        <div className="clients-reminder-modal-footer">
          <button
            type="button"
            className="clients-reminder-modal-footer-btn clients-reminder-modal-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className={`clients-reminder-modal-footer-btn clients-reminder-modal-set-btn${canSubmit ? ' clients-reminder-modal-set-btn-active' : ''}`}
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isSubmitting ? 'Сохранение...' : 'Установить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsReminderModal;
