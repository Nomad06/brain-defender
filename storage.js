// Единый модуль для работы с chrome.storage
// Унифицирует работу с данными сайтов во всех модулях
// STORAGE_KEY загружается из consts.js

// Fallback для случая, если consts.js не загружен
if (typeof STORAGE_KEY === 'undefined') {
  if (typeof window !== 'undefined') {
    var STORAGE_KEY = "blockedSites";
  } else {
    var STORAGE_KEY = "blockedSites";
  }
}

/**
 * Получает список заблокированных сайтов из хранилища
 * Поддерживает старый формат (массив строк) и новый формат (массив объектов)
 * @returns {Promise<Array>} - Массив сайтов в формате { host, addedAt, category, schedule }
 */
async function getSites() {
  try {
    const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
    const raw = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    
    // Проверяем формат данных (старый или новый)
    if (raw.length > 0 && typeof raw[0] === 'string') {
      // Старый формат - массив строк, нормализуем и возвращаем
      const normalizeFn = (typeof window !== 'undefined' && window.utils && window.utils.normalizeHost) 
        ? window.utils.normalizeHost 
        : ((typeof self !== 'undefined' && self.utils && self.utils.normalizeHost)
          ? self.utils.normalizeHost
          : null);
      
      if (normalizeFn) {
        const cleaned = [...new Set(raw.map(normalizeFn).filter(Boolean))].sort();
        return cleaned.map(host => ({ 
          host, 
          addedAt: Date.now(), 
          category: null, 
          schedule: null 
        }));
      }
      
      // Fallback без нормализации
      return raw.map(host => ({
        host: String(host).toLowerCase().replace(/^www\./, ""),
        addedAt: Date.now(),
        category: null,
        schedule: null
      }));
    }
    
    // Новый формат - массив объектов
    const normalizeFn = (typeof window !== 'undefined' && window.utils && window.utils.normalizeHost) 
      ? window.utils.normalizeHost 
      : ((typeof self !== 'undefined' && self.utils && self.utils.normalizeHost)
        ? self.utils.normalizeHost
        : null);
    
    const sites = raw
      .map(item => {
        if (typeof item === 'string') {
          const host = normalizeFn ? normalizeFn(item) : String(item).toLowerCase().replace(/^www\./, "");
          return { 
            host, 
            addedAt: Date.now(), 
            category: null, 
            schedule: null 
          };
        }
        const host = normalizeFn 
          ? normalizeFn(item.host || item) 
          : String(item.host || item).toLowerCase().replace(/^www\./, "");
        return {
          host,
          addedAt: item.addedAt || Date.now(),
          category: item.category || null,
          schedule: item.schedule || null
        };
      })
      .filter(item => item.host)
      .sort((a, b) => a.host.localeCompare(b.host));
    
    return sites;
  } catch (err) {
    console.error('[Storage] Error getting sites:', err);
    return [];
  }
}

/**
 * Сохраняет список заблокированных сайтов в хранилище
 * @param {Array} sites - Массив сайтов для сохранения
 * @returns {Promise<void>}
 */
async function setSites(sites) {
  try {
    // Нормализуем и валидируем данные перед сохранением
    const normalizeFn = (typeof window !== 'undefined' && window.utils && window.utils.normalizeHost) 
      ? window.utils.normalizeHost 
      : ((typeof self !== 'undefined' && self.utils && self.utils.normalizeHost)
        ? self.utils.normalizeHost
        : null);
    
    const normalized = sites.map(site => {
      if (typeof site === 'string') {
        const host = normalizeFn ? normalizeFn(site) : String(site).toLowerCase().replace(/^www\./, "");
        return {
          host,
          addedAt: Date.now(),
          category: null,
          schedule: null
        };
      }
      const host = normalizeFn 
        ? normalizeFn(site.host || site) 
        : String(site.host || site).toLowerCase().replace(/^www\./, "");
      return {
        host,
        addedAt: site.addedAt || Date.now(),
        category: site.category || null,
        schedule: site.schedule || null
      };
    }).filter(item => item.host);
    
    // Сортируем по хосту
    normalized.sort((a, b) => a.host.localeCompare(b.host));
    
    // Проверяем размер данных перед сохранением (лимит sync storage ~100KB)
    const dataString = JSON.stringify(normalized);
    const MAX_SIZE = 100 * 1024; // 100KB
    
    if (dataString.length > MAX_SIZE) {
      throw new Error(`Данные слишком большие (${Math.round(dataString.length / 1024)}KB). Максимальный размер: 100KB. Удалите некоторые сайты.`);
    }
    
    await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
  } catch (err) {
    console.error('[Storage] Error setting sites:', err);
    throw err;
  }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.storage = {
    getSites,
    setSites
  };
}

// Для service worker (где window не определен)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.storage = {
    getSites,
    setSites
  };
}

