import { useEffect, useMemo, useState } from 'react';
import { axiosApi } from '../../../../axiosApi';
import type { CreatedInventoryItem } from '../../../../types';
import { CheckIconForRestockModal, CloseIconForRestockModal } from '../InventoryIcons/InventoryIcons';
import '../InventoryModal/InventoryModal.css';
import './InventoryRestockModal.css';

interface InventoryRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (item: CreatedInventoryItem) => void;
  itemToRestock?: CreatedInventoryItem | null;
}

interface RestockResponse {
  message: string;
  item: CreatedInventoryItem;
}

const InventoryRestockModal = ({
  isOpen,
  onClose,
  onUpdated,
  itemToRestock = null,
}: InventoryRestockModalProps) => {
  const [addedQuantity, setAddedQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAddedQuantity('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const parsedAddedQuantity = Number(addedQuantity);
  const isFormValid = useMemo(() => Number.isFinite(parsedAddedQuantity) && parsedAddedQuantity > 0, [parsedAddedQuantity]);
  const nextQuantity = itemToRestock ? itemToRestock.quantity + (isFormValid ? parsedAddedQuantity : 0) : 0;

  if (!isOpen || !itemToRestock) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      setErrorMessage('Укажи корректное количество для пополнения.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const { data } = await axiosApi.patch<RestockResponse>(`/inventory/${itemToRestock.id}/add-stock`, {
        addedQuantity: parsedAddedQuantity,
      });

      onUpdated(data.item);
      onClose();
    } catch {
      setErrorMessage('Не удалось пополнить склад. Проверь подключение к серверу и попробуй еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-modal-overlay" role="presentation" onClick={onClose}>
      <div className="inventory-modal inventory-restock-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-header">
            <div className="inventory-modal-heading">
              <h2 className="inventory-modal-tittle">Пополнить остаток</h2>
              <p className="inventory-modal-subTittle">Добавь новую партию товара для позиции «{itemToRestock.name}».</p>
            </div>

            <button type="button" className="inventory-modal-quit-btn" onClick={onClose} aria-label="Закрыть окно">
              <CloseIconForRestockModal />
            </button>
          </div>

          <div className="inventory-modal-body">
            <div className="inventory-restock-summary">
              <div className="inventory-restock-card">
                <span className="inventory-modal-label">Текущий остаток</span>
                <strong className="inventory-restock-value">{itemToRestock.quantity} шт</strong>
              </div>
              <div className="inventory-restock-card">
                <span className="inventory-modal-label">Станет после пополнения</span>
                <strong className="inventory-restock-value">{nextQuantity} шт</strong>
              </div>
            </div>

            <div className="inventory-modal-field">
              <label className="inventory-modal-label" htmlFor="inventory-restock-quantity">
                Количество для пополнения
              </label>
              <div className="inventory-modal-input-wrap">
                <input
                  id="inventory-restock-quantity"
                  className="inventory-modal-input inventory-modal-input-number"
                  type="number"
                  min="1"
                  value={addedQuantity}
                  onChange={(event) => setAddedQuantity(event.target.value)}
                  placeholder="0"
                />
                <span className="inventory-modal-suffix">шт</span>
              </div>
            </div>

            {errorMessage ? <p className="inventory-modal-error">{errorMessage}</p> : null}
          </div>

          <div className="inventory-modal-footer">
            <button type="button" className="inventory-modal-cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className={isFormValid ? 'inventory-modal-save-btn inventory-modal-save-btn-active' : 'inventory-modal-save-btn'}
              disabled={!isFormValid || isSubmitting}
            >
              <CheckIconForRestockModal />
              <span>{isSubmitting ? 'Сохраняем...' : 'Пополнить склад'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryRestockModal;
