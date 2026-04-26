import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { axiosApi } from '../../../../axiosApi';
import type { BouquetTemplate } from '../../../../types';
import {
  CloseIconForModal,
  InventoryFallbackIcon,
} from '../InventoryIcons/InventoryIcons';
import './InventoryBouquetModal.css';

interface InventoryBouquetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (template: BouquetTemplate) => void;
  onDeleted?: (templateId: number) => void;
  templateToEdit?: BouquetTemplate | null;
  canDelete?: boolean;
}

interface UpdateBouquetTemplateResponse {
  message: string;
  template: BouquetTemplate;
}

interface BouquetFormState {
  name: string;
  price: string;
  imageUrl: string;
}

const initialFormState: BouquetFormState = {
  name: '',
  price: '',
  imageUrl: '',
};

const InventoryBouquetModal = ({
  isOpen,
  onClose,
  onSaved,
  onDeleted,
  templateToEdit = null,
  canDelete = false,
}: InventoryBouquetModalProps) => {
  const [formState, setFormState] = useState<BouquetFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !templateToEdit) {
      setFormState(initialFormState);
      setErrorMessage('');
      setIsSubmitting(false);
      return;
    }

    setFormState({
      name: templateToEdit.name,
      price: String(templateToEdit.price),
      imageUrl: templateToEdit.imageUrl ?? '',
    });
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, templateToEdit]);

  const isFormValid = useMemo(() => {
    return formState.name.trim() !== '' && formState.price.trim() !== '' && Number(formState.price) >= 0;
  }, [formState]);

  if (!isOpen || !templateToEdit) {
    return null;
  }

  const previewImageUrl = formState.imageUrl.trim();

  const handleChange =
    (field: keyof BouquetFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prevState) => ({
        ...prevState,
        [field]: event.target.value,
      }));
    };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      setErrorMessage('Заполни название и цену букета.');
      toast.error('Заполни название и цену букета.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const response = await toast.promise(
        axiosApi.put<UpdateBouquetTemplateResponse>(
          `/inventory/templates/${templateToEdit.id}`,
          {
            name: formState.name.trim(),
            price: Number(formState.price),
            imageUrl: previewImageUrl ? previewImageUrl : null,
          },
        ),
        {
          pending: 'Обновляем шаблон букета...',
          success: 'Шаблон букета обновлен.',
          error: 'Не удалось обновить шаблон букета.',
        },
      );

      const { data } = response;

      onSaved(data.template);
      onClose();
    } catch {
      // Error toast is handled by toast.promise.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || isSubmitting) {
      return;
    }

    const shouldArchive = window.confirm(`Перенести шаблон "${templateToEdit.name}" в архив?`);

    if (!shouldArchive) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await toast.promise(axiosApi.delete(`/inventory/templates/${templateToEdit.id}`), {
        pending: 'Переносим шаблон в архив...',
        success: 'Шаблон букета перенесен в архив.',
        error: 'Не удалось перенести шаблон в архив.',
      });
      onDeleted?.(templateToEdit.id);
      onClose();
    } catch {
      // Error toast is handled by toast.promise.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-bouquet-modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="inventory-bouquet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-bouquet-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="inventory-bouquet-modal-header">
            <div className="inventory-bouquet-modal-heading">
              <h2 id="inventory-bouquet-modal-title" className="inventory-bouquet-modal-title">
                Редактирование букета
              </h2>
              <p className="inventory-bouquet-modal-subtitle">Изменение шаблона</p>
            </div>

            <button
              type="button"
              className="inventory-bouquet-modal-close"
              onClick={handleClose}
              aria-label="Закрыть окно"
            >
              <CloseIconForModal />
            </button>
          </div>

          <div className="inventory-bouquet-modal-body">
            <div className="inventory-bouquet-modal-field">
              <label className="inventory-bouquet-modal-label" htmlFor="inventory-bouquet-name">
                Название букета
              </label>
              <input
                id="inventory-bouquet-name"
                className="inventory-bouquet-modal-input"
                type="text"
                value={formState.name}
                onChange={handleChange('name')}
                placeholder="Например: Весеннее пробуждение"
              />
            </div>

            <div className="inventory-bouquet-modal-field">
              <label className="inventory-bouquet-modal-label" htmlFor="inventory-bouquet-price">
                Цена продажи
              </label>
              <div className="inventory-bouquet-modal-input-wrap">
                <input
                  id="inventory-bouquet-price"
                  className="inventory-bouquet-modal-input inventory-bouquet-modal-input-number"
                  type="number"
                  min="0"
                  value={formState.price}
                  onChange={handleChange('price')}
                  placeholder="0"
                />
                <span className="inventory-bouquet-modal-suffix">сом</span>
              </div>
            </div>

            <div className="inventory-bouquet-modal-field">
              <label className="inventory-bouquet-modal-label" htmlFor="inventory-bouquet-imageUrl">
                Ссылка на фото
              </label>
              <input
                id="inventory-bouquet-imageUrl"
                className="inventory-bouquet-modal-input"
                type="url"
                value={formState.imageUrl}
                onChange={handleChange('imageUrl')}
                placeholder="https://..."
              />
            </div>

            <div className="inventory-bouquet-modal-preview">
              <div className="inventory-bouquet-modal-preview-image">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt={formState.name || templateToEdit.name}
                    className="inventory-bouquet-modal-preview-photo"
                  />
                ) : (
                  <InventoryFallbackIcon className="inventory-bouquet-modal-preview-icon" />
                )}
              </div>

              <div className="inventory-bouquet-modal-preview-meta">
                <span className="inventory-bouquet-modal-preview-badge">Шаблон букета</span>
                <span className="inventory-bouquet-modal-preview-name">
                  {formState.name.trim() || 'Без названия'}
                </span>
              </div>
            </div>

            {errorMessage ? <p className="inventory-bouquet-modal-error">{errorMessage}</p> : null}
          </div>

          <div className="inventory-bouquet-modal-footer">
            {canDelete ? (
              <button
                type="button"
                className="inventory-bouquet-modal-delete"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Удалить
              </button>
            ) : (
              <span />
            )}

            <div className="inventory-bouquet-modal-footer-actions">
              <button
                type="button"
                className="inventory-bouquet-modal-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button type="submit" className="inventory-bouquet-modal-save" disabled={!isFormValid || isSubmitting}>
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryBouquetModal;
