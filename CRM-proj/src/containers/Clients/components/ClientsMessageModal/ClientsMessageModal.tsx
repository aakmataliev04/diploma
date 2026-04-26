import { useMemo, useState } from 'react';
import { ClientModalCloseIcon, MessageIcon } from '../ClientsIcons/ClientsIcons';
import './ClientsMessageModal.css';

type MessageTemplateKey =
  | 'birthday'
  | 'anniversary'
  | 'march8'
  | 'feb14'
  | 'teachers-day'
  | 'mothers-day'
  | 'custom';

interface ClientsMessageModalProps {
  clientName: string;
  clientPhone: string;
  isOpen: boolean;
  templateHint?: string | null;
  onClose: () => void;
}

interface MessageTemplateConfig {
  label: string;
  discountPercent: number | null;
  text: string;
}

const getTemplateFromHint = (hint?: string | null): MessageTemplateKey => {
  const normalizedHint = hint?.toLowerCase() ?? '';

  if (normalizedHint.trim() === '') {
    return 'custom';
  }

  if (normalizedHint.includes('рожд')) {
    return 'birthday';
  }

  if (normalizedHint.includes('годов') || normalizedHint.includes('свад')) {
    return 'anniversary';
  }

  if (normalizedHint.includes('8 марта')) {
    return 'march8';
  }

  if (normalizedHint.includes('14 февраля') || normalizedHint.includes('валент')) {
    return 'feb14';
  }

  if (normalizedHint.includes('учител')) {
    return 'teachers-day';
  }

  if (normalizedHint.includes('матер')) {
    return 'mothers-day';
  }

  return 'custom';
};

const MESSAGE_TEMPLATE_CONFIG: Record<MessageTemplateKey, MessageTemplateConfig> = {
  birthday: {
    label: 'День рождение (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! Напоминаем о предстоящем Дне рождения близкого человека. Для такого повода у нас действует скидка 10% на букет, и мы с радостью поможем подобрать красивое поздравление.',
  },
  anniversary: {
    label: 'Годовщина (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! Напоминаем о приближающейся годовщине. Для этого повода у нас действует скидка 10% на букет или цветочную композицию, и мы с удовольствием подготовим красивый подарок.',
  },
  march8: {
    label: '8 марта (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! К 8 Марта у нас действует скидка 10% на весенние букеты. С радостью поможем подобрать нежный и красивый вариант для поздравления.',
  },
  feb14: {
    label: '14 февраля (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! К 14 февраля у нас действует скидка 10% на романтичные букеты. С удовольствием соберем для вас особенный подарок для любимого человека.',
  },
  'teachers-day': {
    label: 'День учителя (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! Ко Дню учителя у нас действует скидка 10% на букеты для поздравлений. Поможем быстро подобрать аккуратный и красивый вариант для важного повода.',
  },
  'mothers-day': {
    label: 'День матери (скидка 10%)',
    discountPercent: 10,
    text:
      'Здравствуйте, {{clientName}}! Ко Дню матери у нас действует скидка 10% на нежные букеты и композиции. С радостью поможем порадовать самого близкого человека красивым подарком.',
  },
  custom: {
    label: 'Другое / Персональное предложение',
    discountPercent: null,
    text: '',
  },
};

const templateOptions: Array<{ value: MessageTemplateKey; label: string }> = (
  Object.entries(MESSAGE_TEMPLATE_CONFIG) as Array<[MessageTemplateKey, MessageTemplateConfig]>
).map(([value, config]) => ({
  value,
  label: config.label,
}));

const buildTemplateMessage = (template: MessageTemplateKey, clientName: string) => {
  const safeName = clientName.trim() || 'дорогой клиент';
  return MESSAGE_TEMPLATE_CONFIG[template].text.replaceAll('{{clientName}}', safeName);
};

const sanitizePhoneForWhatsApp = (value: string) => value.replace(/\D/g, '');

const ClientsMessageModal = ({
  clientName,
  clientPhone,
  isOpen,
  templateHint,
  onClose,
}: ClientsMessageModalProps) => {
  const initialTemplate = useMemo(() => getTemplateFromHint(templateHint), [templateHint]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateKey>(initialTemplate);
  const [messageText, setMessageText] = useState(() => buildTemplateMessage(initialTemplate, clientName));

  if (!isOpen) {
    return null;
  }

  const handleTemplateChange = (value: MessageTemplateKey) => {
    setSelectedTemplate(value);
    setMessageText(buildTemplateMessage(value, clientName));
  };

  const handleSend = () => {
    const normalizedPhone = sanitizePhoneForWhatsApp(clientPhone);
    const normalizedMessage = messageText.trim();

    if (!normalizedPhone || !normalizedMessage) {
      return;
    }

    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(normalizedMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="clients-message-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="clients-message-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clients-message-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="clients-message-modal-header">
          <div className="clients-message-modal-title-wrap">
            <span className="clients-message-modal-icon-wrap">
              <MessageIcon className="clients-message-modal-title-icon" />
            </span>
            <h2 id="clients-message-modal-title" className="clients-message-modal-title">
              WhatsApp Сообщение
            </h2>
          </div>

          <button
            type="button"
            className="clients-message-modal-close-btn"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <ClientModalCloseIcon className="clients-message-modal-close-icon" />
          </button>
        </div>

        <div className="clients-message-modal-body">
          <div className="clients-message-modal-recipient">
            <p className="clients-message-modal-recipient-line">
              <span className="clients-message-modal-recipient-label">Получатель:</span> {clientName}
            </p>
            <p className="clients-message-modal-recipient-line">
              <span className="clients-message-modal-recipient-label">Телефон:</span> {clientPhone}
            </p>
          </div>

          <div className="clients-message-modal-field">
            <label className="clients-message-modal-label" htmlFor="clients-message-template">
              Шаблон сообщения
            </label>
            <select
              id="clients-message-template"
              className="clients-message-modal-select"
              value={selectedTemplate}
              onChange={(event) => handleTemplateChange(event.target.value as MessageTemplateKey)}
            >
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="clients-message-modal-field">
            <label className="clients-message-modal-label" htmlFor="clients-message-text">
              Текст сообщения
            </label>
            <textarea
              id="clients-message-text"
              className="clients-message-modal-textarea"
              value={messageText}
              placeholder="Введите текст сообщения..."
              onChange={(event) => setMessageText(event.target.value)}
            />
          </div>
        </div>

        <div className="clients-message-modal-footer">
          <button
            type="button"
            className="clients-message-modal-footer-btn clients-message-modal-cancel-btn"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="clients-message-modal-footer-btn clients-message-modal-send-btn"
            onClick={handleSend}
          >
            <MessageIcon className="clients-message-modal-send-icon" />
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsMessageModal;
