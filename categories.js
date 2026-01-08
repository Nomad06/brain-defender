// Система категорий сайтов

const DEFAULT_CATEGORIES = [
  'Соцсети',
  'Развлечения',
  'Новости',
  'Игры',
  'Видео',
  'Покупки',
  'Другое'
];

// Получение всех категорий
function getCategories() {
  try {
    const stored = localStorage.getItem('siteCategories');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('[Categories] Error loading categories:', err);
  }
  return [...DEFAULT_CATEGORIES];
}

// Сохранение категорий
function saveCategories(categories) {
  try {
    localStorage.setItem('siteCategories', JSON.stringify(categories));
    return true;
  } catch (err) {
    console.error('[Categories] Error saving categories:', err);
    return false;
  }
}

// Добавление новой категории
function addCategory(category) {
  const categories = getCategories();
  if (!categories.includes(category)) {
    categories.push(category);
    saveCategories(categories);
  }
  return categories;
}

// Группировка сайтов по категориям
function groupSitesByCategory(sites) {
  const grouped = {};
  const uncategorized = [];
  
  sites.forEach(site => {
    const category = typeof site === 'object' && site.category ? site.category : null;
    if (!category) {
      uncategorized.push(site);
      return;
    }
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(site);
  });
  
  if (uncategorized.length > 0) {
    grouped['Без категории'] = uncategorized;
  }
  
  return grouped;
}

// Фильтрация сайтов по категории
function filterSitesByCategory(sites, category) {
  if (!category || category === 'Все') {
    return sites;
  }
  
  return sites.filter(site => {
    const siteCategory = typeof site === 'object' && site.category ? site.category : null;
    return siteCategory === category;
  });
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.categories = {
    DEFAULT_CATEGORIES,
    getCategories,
    saveCategories,
    addCategory,
    groupSitesByCategory,
    filterSitesByCategory
  };
}

