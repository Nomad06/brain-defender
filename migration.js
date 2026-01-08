// Функция миграции данных из старого формата в новый
// Константы STORAGE_KEY и MIGRATION_VERSION_KEY загружаются из consts.js
// Fallback только для service worker (где window не определен)
if (typeof window === 'undefined' && typeof MIGRATION_VERSION_KEY === 'undefined') {
  var MIGRATION_VERSION_KEY = "dataMigrationVersion";
}
if (typeof window === 'undefined' && typeof STORAGE_KEY === 'undefined') {
  var STORAGE_KEY = "blockedSites";
}
const CURRENT_VERSION = 2; // Версия структуры данных
const MIGRATION_LOCK_KEY = "migrationLock"; // Ключ для блокировки миграции
const MIGRATION_LOCK_TIMEOUT = 30000; // 30 секунд таймаут блокировки

/**
 * Получает блокировку миграции (mutex)
 * @returns {Promise<boolean>} - true если блокировка получена, false если уже заблокировано
 */
async function acquireMigrationLock() {
  try {
    const lockData = await chrome.storage.local.get({ [MIGRATION_LOCK_KEY]: null });
    const lock = lockData[MIGRATION_LOCK_KEY];
    
    if (lock) {
      // Проверяем, не истекла ли блокировка
      const now = Date.now();
      if (now - lock.timestamp < MIGRATION_LOCK_TIMEOUT) {
        // Блокировка активна
        return false;
      }
      // Блокировка истекла, освобождаем её
      console.log('[Migration] Lock expired, releasing');
    }
    
    // Устанавливаем блокировку
    await chrome.storage.local.set({
      [MIGRATION_LOCK_KEY]: {
        timestamp: Date.now(),
        version: CURRENT_VERSION
      }
    });
    
    return true;
  } catch (err) {
    console.error('[Migration] Error acquiring lock:', err);
    return false;
  }
}

/**
 * Освобождает блокировку миграции
 */
async function releaseMigrationLock() {
  try {
    await chrome.storage.local.remove([MIGRATION_LOCK_KEY]);
  } catch (err) {
    console.error('[Migration] Error releasing lock:', err);
  }
}

async function migrateData() {
  // Пытаемся получить блокировку
  const lockAcquired = await acquireMigrationLock();
  if (!lockAcquired) {
    console.log('[Migration] Migration already in progress, skipping');
    return { migrated: false, reason: 'Migration in progress' };
  }
  
  try {
    // Проверяем версию миграции
    const migrationData = await chrome.storage.local.get({ [MIGRATION_VERSION_KEY]: 0 });
    const currentVersion = migrationData[MIGRATION_VERSION_KEY] || 0;
    
    if (currentVersion >= CURRENT_VERSION) {
      console.log('[Migration] Data already migrated to version', CURRENT_VERSION);
      await releaseMigrationLock();
      return { migrated: false, reason: 'Already migrated' };
    }
    
    console.log('[Migration] Starting migration from version', currentVersion, 'to', CURRENT_VERSION);
    
    // Получаем текущие данные
    const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
    const sites = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    
    if (sites.length === 0) {
      // Нет данных для миграции
      await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: CURRENT_VERSION });
      return { migrated: false, reason: 'No data to migrate' };
    }
    
    // Проверяем формат данных
    const isOldFormat = sites.length > 0 && typeof sites[0] === 'string';
    
    if (!isOldFormat) {
      // Данные уже в новом формате, просто обновляем версию
      await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: CURRENT_VERSION });
      return { migrated: false, reason: 'Already in new format' };
    }
    
    // Мигрируем из старого формата в новый
    const migratedSites = sites.map(host => {
      if (typeof host === 'string') {
        return {
          host: host.toLowerCase().replace(/^www\./, ""),
          addedAt: Date.now(),
          category: null,
          schedule: null
        };
      }
      // Уже объект, но может не хватать полей
      return {
        host: host.host || host,
        addedAt: host.addedAt || Date.now(),
        category: host.category || null,
        schedule: host.schedule || null
      };
    }).filter(site => site.host);
    
    // Сохраняем мигрированные данные
    await chrome.storage.sync.set({ [STORAGE_KEY]: migratedSites });
    
    // Обновляем версию миграции
    await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: CURRENT_VERSION });
    
    console.log('[Migration] Successfully migrated', migratedSites.length, 'sites');
    
    await releaseMigrationLock();
    
    return { 
      migrated: true, 
      sitesCount: migratedSites.length,
      fromVersion: currentVersion,
      toVersion: CURRENT_VERSION
    };
  } catch (err) {
    console.error('[Migration] Error during migration:', err);
    await releaseMigrationLock();
    return { migrated: false, error: err.message };
  }
}

// Автоматическая миграция при загрузке
if (typeof window !== 'undefined') {
  // Для страниц
  (async () => {
    if (window.migration) {
      await window.migration.migrate();
    }
  })();
} else {
  // Для service worker
  migrateData().catch(err => {
    console.error('[Migration] Failed to migrate:', err);
  });
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.migration = {
    migrate: migrateData,
    CURRENT_VERSION
  };
}

