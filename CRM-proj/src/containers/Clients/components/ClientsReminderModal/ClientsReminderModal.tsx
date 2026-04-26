import { useState } from 'react';
import {
  ClientCardRemindIcon,
  ClientModalCloseIcon,
} from '../ClientsIcons/ClientsIcons';
import './ClientsReminderModal.css';

interface ClientsReminderModalProps {
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClientsReminderModal = ({ clientName, isOpen, onClose }: ClientsReminderModalProps) => {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [noteValue, setNoteValue] = useState('');

  if (!isOpen) {
    return null;
  }

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
          >
            Отмена
          </button>
          <button
            type="button"
            className="clients-reminder-modal-footer-btn clients-reminder-modal-set-btn"
            disabled
          >
            Установить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsReminderModal;
