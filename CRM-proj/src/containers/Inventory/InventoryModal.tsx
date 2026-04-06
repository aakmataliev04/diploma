import { useEffect, useMemo, useState } from 'react';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import { CheckIconForModal, CloseIconForModal, ImageInputIconForModal } from './InventoryIcons';
import './InventoryModal.css';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: CreatedInventoryItem) => void;
  onDeleted?: (itemId: number) => void;
  itemToEdit?: CreatedInventoryItem | null;
}

export interface CreatedInventoryItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string | null;
  quantity: number;
  costPrice: number;
  price: number;
  isActive: boolean;
}

interface CreateInventoryResponse {
  message: string;
  item: CreatedInventoryItem;
}

interface InventoryFormState {
  name: string;
  category: string;
  quantity: string;
  costPrice: string;
  price: string;
  imageUrl: string;
}

const initialFormState: InventoryFormState = {
  name: '',
  category: '',
  quantity: '',
  costPrice: '',
  price: '',
  imageUrl: '',
};

const categoryOptions = [
  { label: 'Цветы', value: 'FLOWER' },
  { label: 'Упаковка', value: 'PACKAGING' },
  { label: 'Аксессуары', value: 'ACCESSORY' },
  { label: 'Услуги', value: 'SERVICE' },
];

const InventoryModal = ({
  isOpen,
  onClose,
  onSaved,
  onDeleted,
  itemToEdit = null,
}: InventoryModalProps) => {
  const { session } = useAuth();
  const [formState, setFormState] = useState<InventoryFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = itemToEdit !== null;
  const canDelete = isEditMode && session?.user.role === 'ADMIN';

  useEffect(() => {
    if (!isOpen) {
      setFormState(initialFormState);
      setErrorMessage('');
      setIsSubmitting(false);
      return;
    }

    if (itemToEdit) {
      setFormState({
        name: itemToEdit.name,
        category: itemToEdit.category,
        quantity: String(itemToEdit.quantity),
        costPrice: String(itemToEdit.costPrice),
        price: String(itemToEdit.price),
        imageUrl: itemToEdit.imageUrl ?? '',
      });
      setErrorMessage('');
      setIsSubmitting(false);
      return;
    }

    setFormState(initialFormState);
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, itemToEdit]);

  const isFormValid = useMemo(() => {
    return (
      formState.name.trim() !== '' &&
      formState.category.trim() !== '' &&
      formState.quantity.trim() !== '' &&
      formState.costPrice.trim() !== '' &&
      formState.price.trim() !== ''
    );
  }, [formState]);

  if (!isOpen) {
    return null;
  }

  const handleChange =
    (field: keyof InventoryFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      setErrorMessage('Заполни все обязательные поля.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: formState.name.trim(),
        category: formState.category,
        quantity: Number(formState.quantity),
        costPrice: Number(formState.costPrice),
        price: Number(formState.price),
        imageUrl: formState.imageUrl.trim() ? formState.imageUrl.trim() : null,
      };

      const { data } = isEditMode
        ? await axiosApi.put<CreateInventoryResponse>(`/inventory/${itemToEdit.id}`, payload)
        : await axiosApi.post<CreateInventoryResponse>('/inventory', payload);

      onSaved(data.item);
      onClose();
    } catch (error) {
      setErrorMessage(
        isEditMode
          ? 'Не удалось обновить товар. Проверь заполнение полей и подключение к серверу.'
          : 'Не удалось добавить товар. Проверь заполнение полей и подключение к серверу.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit || !canDelete || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await axiosApi.delete(`/inventory/${itemToEdit.id}`);
      onDeleted?.(itemToEdit.id);
      onClose();
    } catch (error) {
      setErrorMessage('Не удалось удалить товар. Проверь подключение к серверу и попробуй еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-modal-overlay" role="presentation" onClick={handleClose}>
      <div className="inventory-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-header">
            <div className="inventory-modal-heading">
              <h2 className="inventory-modal-tittle">
                {isEditMode ? 'Редактировать товар' : 'Добавить товар на склад'}
              </h2>
              <p className="inventory-modal-subTittle">
                {isEditMode
                  ? 'Измени данные карточки и сохрани обновления.'
                  : 'Новая позиция сразу появится в рабочем каталоге склада.'}
              </p>
            </div>

            <button type="button" className="inventory-modal-quit-btn" onClick={handleClose} aria-label="Закрыть окно">
              <CloseIconForModal />
            </button>
          </div>

          <div className="inventory-modal-body">
            <div className="inventory-modal-content">
              <section className="inventory-modal-section inventory-modal-section-main">
                <h3 className="inventory-modal-secondaryTittle">ОСНОВНАЯ ИНФОРМАЦИЯ</h3>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-name">
                    Название товара
                  </label>
                  <input
                    id="inventory-name"
                    className="inventory-modal-input"
                    type="text"
                    value={formState.name}
                    onChange={handleChange('name')}
                    placeholder="Например: Пион голландский"
                  />
                </div>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-category">
                    Категория
                  </label>
                  <select
                    id="inventory-category"
                    className="inventory-modal-input inventory-modal-select"
                    value={formState.category}
                    onChange={handleChange('category')}
                  >
                    <option value="">Выбери категорию</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-imageUrl">
                    URL фотографии <span className="inventory-modal-optional">(Необязательно)</span>
                  </label>
                  <div className="inventory-modal-image-row">
                    <input
                      id="inventory-imageUrl"
                      className="inventory-modal-input"
                      type="url"
                      value={formState.imageUrl}
                      onChange={handleChange('imageUrl')}
                      placeholder="https://..."
                    />
                    <button type="button" className="inventory-modal-image-btn" aria-label="Фото товара">
                      <ImageInputIconForModal />
                    </button>
                  </div>
                </div>
              </section>

              <section className="inventory-modal-section inventory-modal-section-cost">
                <h3 className="inventory-modal-secondaryTittle">УЧЕТ И СТОИМОСТЬ</h3>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-quantity">
                    Количество
                  </label>
                  <div className="inventory-modal-input-wrap">
                    <input
                      id="inventory-quantity"
                      className="inventory-modal-input inventory-modal-input-number"
                      type="number"
                      min="0"
                      value={formState.quantity}
                      onChange={handleChange('quantity')}
                      placeholder="0"
                    />
                    <span className="inventory-modal-suffix">шт</span>
                  </div>
                </div>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-costPrice">
                    Себестоимость
                  </label>
                  <div className="inventory-modal-input-wrap">
                    <input
                      id="inventory-costPrice"
                      className="inventory-modal-input inventory-modal-input-number"
                      type="number"
                      min="0"
                      value={formState.costPrice}
                      onChange={handleChange('costPrice')}
                      placeholder="0"
                    />
                    <span className="inventory-modal-suffix">сом</span>
                  </div>
                </div>

                <div className="inventory-modal-field">
                  <label className="inventory-modal-label" htmlFor="inventory-price">
                    Цена продажи
                  </label>
                  <div className="inventory-modal-input-wrap">
                    <input
                      id="inventory-price"
                      className="inventory-modal-input inventory-modal-input-number"
                      type="number"
                      min="0"
                      value={formState.price}
                      onChange={handleChange('price')}
                      placeholder="0"
                    />
                    <span className="inventory-modal-suffix">сом</span>
                  </div>
                </div>
              </section>
            </div>

            {errorMessage ? <p className="inventory-modal-error">{errorMessage}</p> : null}
          </div>

          <div className="inventory-modal-footer">
            {canDelete ? (
              <button
                type="button"
                className="inventory-modal-delete-btn"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Удалить
              </button>
            ) : null}
            <button type="button" className="inventory-modal-cancel-btn" onClick={handleClose}>
              Отмена
            </button>
            <button
              type="submit"
              className={isFormValid ? 'inventory-modal-save-btn inventory-modal-save-btn-active' : 'inventory-modal-save-btn'}
              disabled={!isFormValid || isSubmitting}
            >
              <CheckIconForModal />
              <span>
                {isSubmitting
                  ? 'Сохраняем...'
                  : isEditMode
                    ? 'Сохранить изменения'
                    : 'Сохранить товар'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
