import { useState } from 'react';
import { toast } from 'react-toastify';
import { axiosApi } from '../../../../axiosApi';
import type { OrderListItemApi } from '../../../../types';
import {
  OrdersBouquetIcon,
  OrdersClientIcon,
  OrdersCloseIcon,
  OrdersItemIcon,
  OrdersPhoneIcon,
} from '../OrdersIcons';
import './OrdersDetailModal.css';

interface OrdersDetailModalProps {
  order: OrderListItemApi | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

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
    return 'Анонимный клиент';
  }
  return order.client.name?.trim() || `Клиент #${order.client.id}`;
};

const getStaffRoleLabel = (role: string) => {
  const normalized = role.toUpperCase();
  if (normalized === 'ADMIN') {
    return 'Администратор';
  }
  if (normalized === 'FLORIST') {
    return 'Флорист';
  }
  return role;
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

const OrdersDetailModal = ({ order, isOpen, onClose, onCancelled }: OrdersDetailModalProps) => {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !order) {
    return null;
  }

  const lineItems = [
    ...order.items.map((line) => ({
      key: `item-${line.id}`,
      name: line.item.name,
      kind: line.item.category === 'SERVICE' ? 'Услуга' : 'Товар',
      isBouquet: false,
      quantity: line.quantity,
      lineTotal: line.priceAtSale * line.quantity,
    })),
    ...order.bouquets.map((line) => ({
      key: `bouquet-${line.id}`,
      name: line.bouquetTemplate.name,
      kind: 'Букет',
      isBouquet: true,
      quantity: line.quantity,
      lineTotal: line.priceAtSale * line.quantity,
    })),
  ];

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      `Отменить заказ ${order.displayNumber}?\nТовары вернутся на склад, заказ будет удалён.`,
    );

    if (!confirmed || isCancelling) {
      return;
    }

    setIsCancelling(true);

    try {
      await axiosApi.delete(`/orders/${order.id}`);
      toast.success('Заказ отменён, склад обновлён');
      onCancelled?.();
      onClose();
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Не удалось отменить заказ';
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="orders-detail-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="orders-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="orders-detail-modal-header">
          <div>
            <h2 id="orders-detail-modal-title" className="orders-detail-modal-title">
              # {order.displayNumber}
            </h2>
            <p className="orders-detail-modal-meta">
              <span>{formatDateTime(order.createdAt)}</span>
              <span className={`orders-source-badge ${getSourceClass(order.source)}`}>{order.source}</span>
            </p>
          </div>
          <button type="button" className="orders-detail-modal-close" aria-label="Закрыть" onClick={onClose}>
            <OrdersCloseIcon className="orders-detail-modal-close-icon" />
          </button>
        </div>

        <div className="orders-detail-modal-body">
          <section className="orders-detail-section">
            <h3 className="orders-detail-section-title">Клиент</h3>
            <div className="orders-detail-client-card">
              <p className="orders-detail-client-name">
                <OrdersClientIcon className="orders-detail-inline-icon" />
                {getClientName(order)}
              </p>
              {order.client ? (
                <p className="orders-detail-client-phone">
                  <OrdersPhoneIcon className="orders-detail-inline-icon" />
                  {order.client.phone}
                </p>
              ) : (
                <p className="orders-detail-client-phone muted">Телефон не указан</p>
              )}
            </div>
          </section>

          <section className="orders-detail-section">
            <h3 className="orders-detail-section-title">Оформил</h3>
            <div className="orders-detail-staff-card">
              {order.createdBy ? (
                <>
                  <p className="orders-detail-staff-name">{order.createdBy.name}</p>
                  <p className="orders-detail-staff-role">{getStaffRoleLabel(order.createdBy.role)}</p>
                </>
              ) : (
                <p className="orders-detail-staff-name muted">Неизвестно</p>
              )}
            </div>
          </section>

          <section className="orders-detail-section">
            <h3 className="orders-detail-section-title">Состав заказа ({lineItems.length})</h3>
            <div className="orders-detail-lines">
              {lineItems.length === 0 ? (
                <p className="orders-detail-empty-lines">Позиции не найдены</p>
              ) : (
                lineItems.map((line) => (
                  <article key={line.key} className="orders-detail-line">
                    <span className={`orders-detail-line-icon-wrap${line.isBouquet ? ' is-bouquet' : ''}`}>
                      {line.isBouquet ? (
                        <OrdersBouquetIcon className="orders-detail-line-icon" />
                      ) : (
                        <OrdersItemIcon className="orders-detail-line-icon" />
                      )}
                    </span>
                    <div className="orders-detail-line-text">
                      <p className="orders-detail-line-name">{line.name}</p>
                      <p className="orders-detail-line-kind">{line.kind}</p>
                    </div>
                    <div className="orders-detail-line-right">
                      <strong>{formatNumber(line.lineTotal)} KGS</strong>
                      <span>× {line.quantity}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {(order.discountAmount > 0 || (order.discountPercent ?? 0) > 0) && (
            <p className="orders-detail-discount-note">
              Скидка
              {order.discountPercent ? ` ${order.discountPercent}%` : ''}
              {order.discountAmount > 0 ? ` (−${formatNumber(order.discountAmount)} KGS)` : ''}
            </p>
          )}
        </div>

        <div className="orders-detail-modal-footer">
          <div className="orders-detail-total">
            <span>Итого</span>
            <strong>{formatNumber(order.totalPrice)} KGS</strong>
          </div>
          <div className="orders-detail-footer-actions">
            <button
              type="button"
              className="orders-detail-cancel-order-btn"
              onClick={() => {
                void handleCancelOrder();
              }}
              disabled={isCancelling}
            >
              {isCancelling ? 'Отменяем...' : 'Отменить заказ'}
            </button>
            <button type="button" className="orders-detail-close-btn" onClick={onClose} disabled={isCancelling}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersDetailModal;
