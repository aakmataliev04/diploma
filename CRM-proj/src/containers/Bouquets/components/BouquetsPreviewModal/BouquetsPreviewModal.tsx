import {
  BouquetModalHeaderIcon,
  BouquetModalPositionIcon,
  BouquetModalPrintIcon,
  CancelIconForBouquets,
  EmptyBouquetPreviewIcon,
} from '../BouquetsIcons/BouquetsIcons';
import type { BouquetPreviewData } from '../../../../types';
import './BouquetsPreviewModal.css';

interface BouquetsPreviewModalProps {
  previewData: BouquetPreviewData | null;
  onClose: () => void;
}

const formatPositionLabel = (count: number) => {
  if (count === 1) {
    return '1 позиция в составе';
  }

  if (count >= 2 && count <= 4) {
    return `${count} позиции в составе`;
  }

  return `${count} позиций в составе`;
};

const BouquetsPreviewModal = ({ previewData, onClose }: BouquetsPreviewModalProps) => {
  if (!previewData) {
    return null;
  }

  const bouquetName = previewData.name.trim() || 'Новый букет';

  return (
    <div className="bouquets-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="bouquets-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Предпросмотр шаблона букета"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bouquets-modal-header">
          <div className="bouquets-modal-heading">
            <div className="bouquets-modal-header-icon">
              <BouquetModalHeaderIcon className="bouquets-modal-header-icon-svg" />
            </div>
            <div className="bouquets-modal-heading-text">
              <h2 className="bouquets-modal-tittle">Технологическая карта</h2>
              <p className="bouquets-modal-subTittle">Рецепт для сборки флористом</p>
            </div>
          </div>

          <button type="button" className="bouquets-modal-close-btn" onClick={onClose} aria-label="Закрыть окно">
            <CancelIconForBouquets className="bouquets-modal-close-icon" />
          </button>
        </div>

        <div className="bouquets-modal-container">
          <div className="bouquet-modal-image-container">
            {previewData.imageUrl ? (
              <img src={previewData.imageUrl} alt={bouquetName} className="bouquet-modal-image" />
            ) : (
              <EmptyBouquetPreviewIcon className="bouquet-modal-empty-icon" />
            )}
          </div>

          <div className="bouquets-modal-content">
            <div className="bouquets-modal-summary">
              <h3 className="bouquets-modal-name">{bouquetName}</h3>
              <div className="bouquets-modal-count">
                <BouquetModalPositionIcon className="bouquets-modal-count-icon" />
                <span>{formatPositionLabel(previewData.ingredients.length)}</span>
              </div>
            </div>

            <div className="bouquets-modal-positions">
              {previewData.ingredients.map((ingredient, index) => (
                <article key={ingredient.itemId} className="bouquets-modal-position">
                  <div className="bouquets-modal-position-index">{index + 1}</div>

                  <div className="bouquets-modal-position-info">
                    <h4 className="bouquets-modal-position-tittle">{ingredient.item.name}</h4>
                    <p className="bouquets-modal-position-subTittle">
                      {ingredient.item.category === 'FLOWER'
                        ? 'Цветы'
                        : ingredient.item.category === 'PACKAGING'
                          ? 'Упаковка'
                          : ingredient.item.category === 'ACCESSORY'
                            ? 'Аксессуары'
                            : ingredient.item.category}
                    </p>
                  </div>

                  <div className="bouquets-modal-position-quantity">{ingredient.quantity} шт</div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="bouquets-modal-footer">
          <div className="bouquets-modal-footer-note">Финансы скрыты в рабочей зоне</div>

          <div className="bouquets-modal-footer-actions">
            <button type="button" className="bouquets-modal-secondary-btn" onClick={onClose}>
              Закрыть
            </button>

            <button type="button" className="bouquets-modal-print-btn">
              <BouquetModalPrintIcon className="bouquets-modal-print-icon" />
              <span>Печать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BouquetsPreviewModal;
