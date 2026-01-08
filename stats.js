// Система статистики блокировок
// STATS_STORAGE_KEY загружается из consts.js
// Fallback только для service worker (где window не определен)
if (typeof window === 'undefined' && typeof STATS_STORAGE_KEY === 'undefined') {
  // В service worker используем var для глобальной области видимости
  var STATS_STORAGE_KEY = "blockStats";
}

// Инициализация статистики
async function initStats() {
  try {
    const data = await chrome.storage.local.get({ [STATS_STORAGE_KEY]: null });
    if (!data[STATS_STORAGE_KEY]) {
      await chrome.storage.local.set({
        [STATS_STORAGE_KEY]: {
          totalBlocks: 0,
          totalSites: 0,
          streakDays: 0,
          lastBlockDate: null,
          bySite: {},
          byDate: {}
        }
      });
    }
  } catch (err) {
    console.error('[Stats] Error initializing stats:', err);
  }
}

// Регистрация блокировки
async function recordBlock(host) {
  try {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const data = await chrome.storage.local.get({ [STATS_STORAGE_KEY]: null });
    let stats = data[STATS_STORAGE_KEY];
    
    if (!stats || typeof stats !== 'object') {
      await initStats();
      const freshData = await chrome.storage.local.get({ [STATS_STORAGE_KEY]: null });
      stats = freshData[STATS_STORAGE_KEY] || {};
    }
    
    // Инициализируем недостающие поля для обратной совместимости
    if (!stats.byDate || typeof stats.byDate !== 'object') {
      stats.byDate = {};
    }
    
    if (!stats.bySite || typeof stats.bySite !== 'object') {
      stats.bySite = {};
    }
    
    if (stats.totalBlocks === undefined || stats.totalBlocks === null) {
      stats.totalBlocks = 0;
    }
    
    if (stats.totalSites === undefined || stats.totalSites === null) {
      stats.totalSites = Object.keys(stats.bySite).length;
    }
    
    if (stats.streakDays === undefined || stats.streakDays === null) {
      stats.streakDays = 0;
    }
    
    // Обновляем общую статистику
    stats.totalBlocks = (stats.totalBlocks || 0) + 1;
    stats.lastBlockDate = now;
    
    // Обновляем статистику по сайту
    if (!stats.bySite[host]) {
      stats.bySite[host] = {
        blocks: 0,
        firstBlocked: now,
        lastBlocked: now,
        visitsToday: 0,
        timeSpentToday: 0, // минуты
        lastVisitTime: null,
        visitsByDate: {} // Дата -> количество посещений
      };
      stats.totalSites = Object.keys(stats.bySite).length;
    }
    
    stats.bySite[host].blocks += 1;
    stats.bySite[host].lastBlocked = now;
    
    // Обновляем счетчики посещений для условных правил
    const siteStats = stats.bySite[host];
    if (!siteStats.visitsByDate || typeof siteStats.visitsByDate !== 'object') {
      siteStats.visitsByDate = {};
    }
    if (!siteStats.visitsByDate[today]) {
      siteStats.visitsByDate[today] = 0;
    }
    siteStats.visitsByDate[today] += 1;
    siteStats.visitsToday = siteStats.visitsByDate[today];
    siteStats.lastVisitTime = now;
    
    // Обновляем статистику по дате
    if (!stats.byDate[today]) {
      stats.byDate[today] = 0;
    }
    stats.byDate[today] += 1;
    
    // Обновляем стрик (последовательные дни БЕЗ блокировок)
    // Стрик увеличивается только если сегодня первая блокировка за день
    // и вчера не было блокировок (или это первый день)
    const todayBlocks = stats.byDate[today] || 0;
    
    if (todayBlocks === 1) {
      // Это первая блокировка сегодня, проверяем стрик
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayBlocks = stats.byDate[yesterdayStr] || 0;
      
      if (yesterdayBlocks === 0) {
        // Вчера не было блокировок - продолжаем или начинаем стрик
        if (stats.streakDays === null || stats.streakDays === undefined) {
          stats.streakDays = 1; // Первый день стрика
        } else {
          // Проверяем, что предыдущий день был последовательным
          const lastBlockDate = stats.lastBlockDate ? new Date(stats.lastBlockDate) : null;
          if (lastBlockDate) {
            const lastBlockDateStr = lastBlockDate.toISOString().split('T')[0];
            const daysDiff = Math.floor((new Date(today) - new Date(lastBlockDateStr)) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              // Последовательный день - увеличиваем стрик
              stats.streakDays = (stats.streakDays || 0) + 1;
            } else if (daysDiff > 1) {
              // Пропущены дни - сбрасываем стрик
              stats.streakDays = 1; // Начинаем новый стрик с сегодня
            }
            // Если daysDiff === 0, это тот же день - стрик не меняется
          } else {
            // Нет предыдущей даты блокировки - начинаем стрик
            stats.streakDays = 1;
          }
        }
      } else {
        // Вчера были блокировки - сбрасываем стрик
        stats.streakDays = 0;
      }
    }
    // Если это не первая блокировка сегодня, стрик не меняется
    
    await chrome.storage.local.set({ [STATS_STORAGE_KEY]: stats });
    
    // Проверяем достижения после обновления статистики
    if (typeof self !== 'undefined' && self.achievements && self.achievements.checkAchievements) {
      try {
        // Получаем список сайтов для проверки достижений
        const sitesData = await chrome.storage.sync.get({ blockedSites: [] });
        const sites = Array.isArray(sitesData.blockedSites) ? sitesData.blockedSites : [];
        
        const newAchievements = await self.achievements.checkAchievements(stats, sites, host);
        
        // Отправляем уведомления о новых достижениях
        if (newAchievements.length > 0) {
          for (const achievement of newAchievements) {
            try {
              await chrome.notifications.create(`achievement_${achievement.id}_${Date.now()}`, {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title: '🎉 Достижение разблокировано!',
                message: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
                priority: 2
              });
            } catch (notifErr) {
              console.debug('[Stats] Failed to show achievement notification:', notifErr);
            }
          }
        }
      } catch (achievementsErr) {
        console.debug('[Stats] Error checking achievements:', achievementsErr);
      }
    }
    
    return stats;
  } catch (err) {
    console.error('[Stats] Error recording block:', err);
    return null;
  }
}

// Получение статистики
async function getStats() {
  try {
    const data = await chrome.storage.local.get({ [STATS_STORAGE_KEY]: null });
    if (!data[STATS_STORAGE_KEY]) {
      await initStats();
      const freshData = await chrome.storage.local.get({ [STATS_STORAGE_KEY]: null });
      return freshData[STATS_STORAGE_KEY];
    }
    return data[STATS_STORAGE_KEY];
  } catch (err) {
    console.error('[Stats] Error getting stats:', err);
    return null;
  }
}

// Очистка статистики
async function clearStats() {
  try {
    await chrome.storage.local.set({
      [STATS_STORAGE_KEY]: {
        totalBlocks: 0,
        totalSites: 0,
        streakDays: 0,
        lastBlockDate: null,
        bySite: {},
        byDate: {}
      }
    });
    return true;
  } catch (err) {
    console.error('[Stats] Error clearing stats:', err);
    return false;
  }
}

// Экспорт статистики
async function exportStats(format = 'json') {
  try {
    const stats = await getStats();
    if (!stats) return null;
    
    if (format === 'json') {
      return JSON.stringify(stats, null, 2);
    } else if (format === 'csv') {
      // CSV формат для статистики по сайтам
      const lines = ['Host,Blocks,First Blocked,Last Blocked'];
      for (const [host, siteStats] of Object.entries(stats.bySite)) {
        const firstDate = new Date(siteStats.firstBlocked).toISOString();
        const lastDate = new Date(siteStats.lastBlocked).toISOString();
        lines.push(`${host},${siteStats.blocks},${firstDate},${lastDate}`);
      }
      return lines.join('\n');
    }
    return null;
  } catch (err) {
    console.error('[Stats] Error exporting stats:', err);
    return null;
  }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.stats = {
    recordBlock,
    getStats,
    clearStats,
    exportStats,
    initStats
  };
}

