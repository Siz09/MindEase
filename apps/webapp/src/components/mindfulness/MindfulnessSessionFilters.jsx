import { useTranslation } from 'react-i18next';

const MindfulnessSessionFilters = ({
  categories,
  selectedCategory,
  selectedType,
  selectedDifficulty,
  onCategoryChange,
  onTypeChange,
  onDifficultyChange,
  onClear,
}) => {
  const { t } = useTranslation();
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="filters-section">
      <div className="filter-group">
        <label className="filter-label">{t('mindfulness.filterByCategory')}</label>
        <select value={selectedCategory} onChange={onCategoryChange} className="filter-select">
          <option value="all">{t('mindfulness.allCategories')}</option>
          {safeCategories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">{t('mindfulness.filterByType')}</label>
        <select value={selectedType} onChange={onTypeChange} className="filter-select">
          <option value="all">{t('mindfulness.allTypes')}</option>
          <option value="audio">🎵 {t('mindfulness.audio')}</option>
          <option value="animation">🎨 {t('mindfulness.animation')}</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">{t('mindfulness.filterByDifficulty')}</label>
        <select
          value={selectedDifficulty}
          onChange={onDifficultyChange}
          className="filter-select"
        >
          <option value="all">{t('mindfulness.allDifficulties')}</option>
          <option value="beginner">🟢 {t('mindfulness.beginner')}</option>
          <option value="intermediate">🟡 {t('mindfulness.intermediate')}</option>
          <option value="advanced">🔴 {t('mindfulness.advanced')}</option>
        </select>
      </div>

      <button onClick={onClear} className="btn btn-outline clear-filters-btn">
        {t('mindfulness.clearFilters')}
      </button>
    </div>
  );
};

export default MindfulnessSessionFilters;

