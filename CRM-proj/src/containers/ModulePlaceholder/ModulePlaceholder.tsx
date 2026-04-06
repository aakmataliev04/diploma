interface ModulePlaceholderProps {
  title: string;
  description: string;
}

import './ModulePlaceholder.css';

const ModulePlaceholder = ({ title, description }: ModulePlaceholderProps) => {
  return (
    <section className="placeholder-page">
      <div className="placeholder-page__badge">Скоро здесь будет рабочий модуль</div>
      <h2 className="placeholder-page__title">{title}</h2>
      <p className="placeholder-page__description">{description}</p>
    </section>
  );
};

export default ModulePlaceholder;
