// Система достижений и бейджей
// ACHIEVEMENTS_STORAGE_KEY загружается из consts.js или определяется здесь

if (typeof ACHIEVEMENTS_STORAGE_KEY === 'undefined') {
  if (typeof window !== 'undefined') {
    var ACHIEVEMENTS_STORAGE_KEY = "achievements";
  } else {
    var ACHIEVEMENTS_STORAGE_KEY = "achievements";
  }
}

// Типы достижений
const ACHIEVEMENT_TYPES = {
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  STREAK_100: 'streak_100',
  TOTAL_BLOCKS_100: 'total_blocks_100',
  TOTAL_BLOCKS_500: 'total_blocks_500',
  TOTAL_BLOCKS_1000: 'total_blocks_1000',
  SITES_BLOCKED_10: 'sites_blocked_10',
  SITES_BLOCKED_50: 'sites_blocked_50',
  SITES_BLOCKED_100: 'sites_blocked_100',
  WEEK_NO_BLOCK: 'week_no_block'
};

// Определения достижений
const ACHIEVEMENT_DEFINITIONS = {
  [ACHIEVEMENT_TYPES.STREAK_7]: {
    id: ACHIEVEMENT_TYPES.STREAK_7,
    name: 'Неделя силы',
    description: '7 дней подряд без блокировок',
    icon: '🔥',
    check: (stats) => stats.streakDays >= 7
  },
  [ACHIEVEMENT_TYPES.STREAK_30]: {
    id: ACHIEVEMENT_TYPES.STREAK_30,
    name: 'Месяц дисциплины',
    description: '30 дней подряд без блокировок',
    icon: '💪',
    check: (stats) => stats.streakDays >= 30
  },
  [ACHIEVEMENT_TYPES.STREAK_100]: {
    id: ACHIEVEMENT_TYPES.STREAK_100,
    name: 'Мастер фокуса',
    description: '100 дней подряд без блокировок',
    icon: '👑',
    check: (stats) => stats.streakDays >= 100
  },
  [ACHIEVEMENT_TYPES.TOTAL_BLOCKS_100]: {
    id: ACHIEVEMENT_TYPES.TOTAL_BLOCKS_100,
    name: 'Первые 100',
    description: '100 блокировок всего',
    icon: '🎯',
    check: (stats) => (stats.totalBlocks || 0) >= 100
  },
  [ACHIEVEMENT_TYPES.TOTAL_BLOCKS_500]: {
    id: ACHIEVEMENT_TYPES.TOTAL_BLOCKS_500,
    name: 'Половина тысячи',
    description: '500 блокировок всего',
    icon: '🏆',
    check: (stats) => (stats.totalBlocks || 0) >= 500
  },
  [ACHIEVEMENT_TYPES.TOTAL_BLOCKS_1000]: {
    id: ACHIEVEMENT_TYPES.TOTAL_BLOCKS_1000,
    name: 'Тысяча побед',
    description: '1000 блокировок всего',
    icon: '🌟',
    check: (stats) => (stats.totalBlocks || 0) >= 1000
  },
  [ACHIEVEMENT_TYPES.SITES_BLOCKED_10]: {
    id: ACHIEVEMENT_TYPES.SITES_BLOCKED_10,
    name: 'Десяточка',
    description: '10 заблокированных сайтов',
    icon: '📋',
    check: (stats, sites) => (sites?.length || 0) >= 10
  },
  [ACHIEVEMENT_TYPES.SITES_BLOCKED_50]: {
    id: ACHIEVEMENT_TYPES.SITES_BLOCKED_50,
    name: 'Полсотни',
    description: '50 заблокированных сайтов',
    icon: '📚',
    check: (stats, sites) => (sites?.length || 0) >= 50
  },
  [ACHIEVEMENT_TYPES.SITES_BLOCKED_100]: {
    id: ACHIEVEMENT_TYPES.SITES_BLOCKED_100,
    name: 'Сотня защит',
    description: '100 заблокированных сайтов',
    icon: '🛡️',
    check: (stats, sites) => (sites?.length || 0) >= 100
  },
  [ACHIEVEMENT_TYPES.WEEK_NO_BLOCK]: {
    id: ACHIEVEMENT_TYPES.WEEK_NO_BLOCK,
    name: 'Неделя без отвлечений',
    description: 'Неделя без блокировок определенного сайта',
    icon: '✨',
    check: (stats, sites, siteHost) => {
      if (!siteHost || !stats.bySite || !stats.bySite[siteHost]) {
        return false;
      }
      const siteStats = stats.bySite[siteHost];
      const lastBlocked = new Date(siteStats.lastBlocked);
      const now = new Date();
      const daysDiff = Math.floor((now - lastBlocked) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7;
    }
  }
};

/**
 * Инициализация системы достижений
 */
async function initAchievements() {
  try {
    const data = await chrome.storage.local.get({ [ACHIEVEMENTS_STORAGE_KEY]: null });
    if (!data[ACHIEVEMENTS_STORAGE_KEY]) {
      await chrome.storage.local.set({
        [ACHIEVEMENTS_STORAGE_KEY]: {
          unlocked: [],
          progress: {},
          lastChecked: null
        }
      });
    }
  } catch (err) {
    console.error('[Achievements] Error initializing:', err);
  }
}

/**
 * Получает список разблокированных достижений
 */
async function getAchievements() {
  try {
    const data = await chrome.storage.local.get({ [ACHIEVEMENTS_STORAGE_KEY]: null });
    if (!data[ACHIEVEMENTS_STORAGE_KEY]) {
      await initAchievements();
      const freshData = await chrome.storage.local.get({ [ACHIEVEMENTS_STORAGE_KEY]: null });
      return freshData[ACHIEVEMENTS_STORAGE_KEY];
    }
    return data[ACHIEVEMENTS_STORAGE_KEY];
  } catch (err) {
    console.error('[Achievements] Error getting achievements:', err);
    return { unlocked: [], progress: {}, lastChecked: null };
  }
}

/**
 * Проверяет достижения и разблокирует новые
 * @param {Object} stats - Статистика блокировок
 * @param {Array} sites - Список заблокированных сайтов
 * @param {string} siteHost - Опционально: конкретный сайт для проверки
 * @returns {Promise<Array>} - Массив новых разблокированных достижений
 */
async function checkAchievements(stats, sites, siteHost = null) {
  try {
    const achievementsData = await getAchievements();
    const unlocked = achievementsData.unlocked || [];
    const newAchievements = [];
    
    // Проверяем каждое достижение
    for (const [type, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      // Пропускаем уже разблокированные
      if (unlocked.includes(type)) {
        continue;
      }
      
      // Проверяем условие достижения
      let passed = false;
      try {
        if (type === ACHIEVEMENT_TYPES.WEEK_NO_BLOCK && siteHost) {
          passed = definition.check(stats, sites, siteHost);
        } else {
          passed = definition.check(stats, sites);
        }
      } catch (err) {
        console.error(`[Achievements] Error checking ${type}:`, err);
        continue;
      }
      
      if (passed) {
        unlocked.push(type);
        newAchievements.push({
          ...definition,
          unlockedAt: Date.now()
        });
      }
    }
    
    // Сохраняем обновленные достижения
    if (newAchievements.length > 0) {
      await chrome.storage.local.set({
        [ACHIEVEMENTS_STORAGE_KEY]: {
          unlocked,
          progress: achievementsData.progress || {},
          lastChecked: Date.now()
        }
      });
    }
    
    return newAchievements;
  } catch (err) {
    console.error('[Achievements] Error checking achievements:', err);
    return [];
  }
}

/**
 * Получает прогресс для достижений
 * @param {Object} stats - Статистика
 * @param {Array} sites - Список сайтов
 * @returns {Promise<Object>} - Объект с прогрессом для каждого достижения
 */
async function getAchievementProgress(stats, sites) {
  try {
    const achievementsData = await getAchievements();
    const unlocked = achievementsData.unlocked || [];
    const progress = {};
    
    for (const [type, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      if (unlocked.includes(type)) {
        progress[type] = { unlocked: true, progress: 100 };
        continue;
      }
      
      // Вычисляем прогресс
      let current = 0;
      let target = 0;
      
      switch (type) {
        case ACHIEVEMENT_TYPES.STREAK_7:
          current = stats.streakDays || 0;
          target = 7;
          break;
        case ACHIEVEMENT_TYPES.STREAK_30:
          current = stats.streakDays || 0;
          target = 30;
          break;
        case ACHIEVEMENT_TYPES.STREAK_100:
          current = stats.streakDays || 0;
          target = 100;
          break;
        case ACHIEVEMENT_TYPES.TOTAL_BLOCKS_100:
          current = stats.totalBlocks || 0;
          target = 100;
          break;
        case ACHIEVEMENT_TYPES.TOTAL_BLOCKS_500:
          current = stats.totalBlocks || 0;
          target = 500;
          break;
        case ACHIEVEMENT_TYPES.TOTAL_BLOCKS_1000:
          current = stats.totalBlocks || 0;
          target = 1000;
          break;
        case ACHIEVEMENT_TYPES.SITES_BLOCKED_10:
          current = sites?.length || 0;
          target = 10;
          break;
        case ACHIEVEMENT_TYPES.SITES_BLOCKED_50:
          current = sites?.length || 0;
          target = 50;
          break;
        case ACHIEVEMENT_TYPES.SITES_BLOCKED_100:
          current = sites?.length || 0;
          target = 100;
          break;
        default:
          current = 0;
          target = 1;
      }
      
      progress[type] = {
        unlocked: false,
        progress: Math.min(100, Math.round((current / target) * 100)),
        current,
        target
      };
    }
    
    return progress;
  } catch (err) {
    console.error('[Achievements] Error getting progress:', err);
    return {};
  }
}

/**
 * Получает все определения достижений
 */
function getAllAchievementDefinitions() {
  return Object.values(ACHIEVEMENT_DEFINITIONS);
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.achievements = {
    initAchievements,
    getAchievements,
    checkAchievements,
    getAchievementProgress,
    getAllAchievementDefinitions,
    ACHIEVEMENT_TYPES
  };
}

// Для service worker (где window не определен)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.achievements = {
    initAchievements,
    getAchievements,
    checkAchievements,
    getAchievementProgress,
    getAllAchievementDefinitions,
    ACHIEVEMENT_TYPES
  };
}

