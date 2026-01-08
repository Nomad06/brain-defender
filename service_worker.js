// Загружаем общие константы первыми
try {
  importScripts('consts.js');
} catch (err) {
  console.error('Failed to load consts.js:', err);
  // Fallback: объявляем константы только если consts.js не загрузился
  if (typeof STORAGE_KEY === 'undefined') {
    var STORAGE_KEY = "blockedSites";
  }
  if (typeof I18N_STORAGE_KEY === 'undefined') {
    var I18N_STORAGE_KEY = "i18n_language";
  }
  if (typeof STATS_STORAGE_KEY === 'undefined') {
    var STATS_STORAGE_KEY = "blockStats";
  }
  if (typeof MIGRATION_VERSION_KEY === 'undefined') {
    var MIGRATION_VERSION_KEY = "dataMigrationVersion";
  }
}

// Загружаем переводы для service worker
try {
  importScripts('translations.js');
} catch (err) {
  console.error('Failed to load translations.js:', err);
}

// Загружаем систему статистики
try {
  importScripts('stats.js');
} catch (err) {
  console.error('Failed to load stats.js:', err);
}

// Загружаем систему расписания
try {
  importScripts('schedule.js');
} catch (err) {
  console.error('Failed to load schedule.js:', err);
}

// Загружаем систему миграции
try {
  importScripts('migration.js');
} catch (err) {
  console.error('Failed to load migration.js:', err);
}

// Загружаем утилиты (нормализация доменов и т.д.)
try {
  importScripts('utils.js');
} catch (err) {
  console.error('Failed to load utils.js:', err);
}

// Загружаем систему условных правил блокировки
try {
  importScripts('conditional_rules.js');
} catch (err) {
  console.error('Failed to load conditional_rules.js:', err);
}

// Загружаем систему фокус-сессий
try {
  importScripts('focus_sessions.js');
} catch (err) {
  console.error('Failed to load focus_sessions.js:', err);
}

// Состояние активной Pomodoro-сессии
let activeFocusSessionSites = null; // Set нормализованных хостов для активной сессии, null если сессия неактивна
let focusSessionEndTime = null; // Время окончания сессии (timestamp)

// Получение языка для service worker (унифицированная логика с i18n.js)
async function getLanguageSW() {
  try {
    // Пробуем получить сохраненный язык
    const data = await chrome.storage.local.get({ [I18N_STORAGE_KEY]: null });
    if (data[I18N_STORAGE_KEY]) {
      return data[I18N_STORAGE_KEY];
    }
    
    // Автоопределение из браузера (для service worker используем chrome.i18n если доступно)
    // В service worker navigator может быть недоступен, поэтому используем fallback
    try {
      // Пробуем получить язык из chrome.i18n API
      const browserLang = chrome.i18n ? chrome.i18n.getUILanguage() : null;
      if (browserLang && browserLang.startsWith('ru')) {
        return 'ru';
      }
    } catch {
      // Игнорируем ошибки
    }
    
    // Fallback на английский
    return 'en';
  } catch (err) {
    console.error('[Service Worker] Error getting language:', err);
    return 'en';
  }
}

// Получение фраз для уведомлений
async function getNotificationPhrases() {
  const lang = await getLanguageSW();
  if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].notifications) {
    return TRANSLATIONS[lang].notifications.phrases || [];
  }
  // Fallback на английские фразы
  return [
    "Wait. Do you really want to go there? Breathe. Let go.",
    "Strength test. A habit is being decided right now.",
    "Don't feed the procrastination loop. Close the tab—and well done.",
    "Take 3 breaths. Then decide if you need it.",
    "You're stronger than the impulse. It will pass in a minute."
  ];
}

// Получение заголовка уведомления
async function getNotificationTitle() {
  const lang = await getLanguageSW();
  if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].notifications) {
    return TRANSLATIONS[lang].notifications.title || "This site is in block list";
  }
  return "This site is in block list";
}

// Используем функции из utils.js
// normalizeHost, escapeRegex, hostToRegex теперь доступны через self.utils

async function getBlockedSites() {
  const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
  const raw = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  
  // Проверяем формат данных (старый или новый)
  const normalizeFn = typeof self !== 'undefined' && self.utils ? self.utils.normalizeHost : normalizeHost;
  if (raw.length > 0 && typeof raw[0] === 'string') {
    // Старый формат - массив строк, нормализуем и возвращаем
    const cleaned = [...new Set(raw.map(normalizeFn).filter(Boolean))].sort();
    return cleaned.map(host => ({ host, schedule: null }));
  }
  
  // Новый формат - массив объектов
  const sites = raw
    .map(item => {
      if (typeof item === 'string') {
        return { host: normalizeFn(item), schedule: null };
      }
      return {
        host: normalizeFn(item.host || item),
        schedule: item.schedule || null
      };
    })
    .filter(item => item.host)
    .sort((a, b) => a.host.localeCompare(b.host));
  
  return sites;
}

// Получение активных сайтов (с учетом расписания, временных исключений и условных правил)
async function getActiveBlockedSites() {
  // #region agent log
  if (typeof self !== 'undefined' && self.fetch) {
    self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:168',message:'getActiveBlockedSites called',data:{hasConditionalRules:typeof self !== 'undefined' && !!self.conditionalRules,hasShouldBlockFn:typeof self !== 'undefined' && self.conditionalRules && typeof self.conditionalRules.shouldBlockByConditionalRules === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  }
  // #endregion
  const sites = await getBlockedSites();
  const now = new Date();
  
  // Получаем статистику для проверки условных правил
  let stats = null;
  if (typeof getStats === 'function') {
    try {
      stats = await getStats();
    } catch (err) {
      console.debug('[Brain Defender] Error getting stats for conditional rules:', err);
    }
  }
  
  const normalizeFn = typeof self !== 'undefined' && self.utils && self.utils.normalizeHost 
    ? self.utils.normalizeHost 
    : null;
  
  const whitelistedHosts = new Set(tempWhitelist.map(item => {
    const normalized = normalizeFn ? normalizeFn(item.host) : item.host.toLowerCase().replace(/^www\./, "");
    return normalized;
  }).filter(Boolean));
  
  // Проверяем активную Pomodoro-сессию
  const isFocusSessionActive = activeFocusSessionSites !== null && 
                                focusSessionEndTime !== null && 
                                Date.now() < focusSessionEndTime;
  
  // Фильтруем основной список сайтов
  // ВАЖНО: Для условных правил нужно динамически проверять при каждом запросе,
  // но declarativeNetRequest работает статически. Поэтому мы включаем сайты с условными правилами
  // в список только когда они должны быть заблокированы, и перестраиваем правила при изменении статистики.
  const activeSites = sites.filter(site => {
    // Проверяем временное исключение
    const normalizedHost = normalizeFn ? normalizeFn(site.host) : site.host.toLowerCase().replace(/^www\./, "");
    if (normalizedHost && whitelistedHosts.has(normalizedHost)) {
      return false; // Исключаем из блокировки
    }
    
    // Проверяем условные правила
    if (site.conditionalRules && Array.isArray(site.conditionalRules) && site.conditionalRules.length > 0 && typeof self !== 'undefined' && self.conditionalRules && self.conditionalRules.shouldBlockByConditionalRules) {
      const siteStats = stats && stats.bySite && stats.bySite[normalizedHost] ? stats.bySite[normalizedHost] : null;
      // #region agent log
      console.log('[DEBUG] Checking conditional rules for:', {host:normalizedHost,hasConditionalRules:!!site.conditionalRules,hasSiteStats:!!siteStats,siteStats,conditionalRules:site.conditionalRules});
      if (typeof self !== 'undefined' && self.fetch) {
        self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:223',message:'Checking conditional rules',data:{host:normalizedHost,hasConditionalRules:!!site.conditionalRules,hasSiteStats:!!siteStats,siteStats,conditionalRules:site.conditionalRules},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      }
      // #endregion
      const shouldBlock = self.conditionalRules.shouldBlockByConditionalRules(site, siteStats);
      // #region agent log
      console.log('[DEBUG] Conditional rules result:', {host:normalizedHost,shouldBlock,siteStats,conditionalRules:site.conditionalRules});
      if (typeof self !== 'undefined' && self.fetch) {
        self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:230',message:'Conditional rules result',data:{host:normalizedHost,shouldBlock,siteStats,conditionalRules:site.conditionalRules},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      }
      // #endregion
      // Если условные правила говорят не блокировать, исключаем сайт из списка блокируемых
      // Правила будут перестроены автоматически при изменении статистики через chrome.storage.onChanged
      if (!shouldBlock) {
        console.log('[DEBUG] Site excluded from blocking due to conditional rules:', normalizedHost);
        return false; // Условные правила говорят не блокировать сейчас
      }
      console.log('[DEBUG] Site should be blocked due to conditional rules:', normalizedHost);
      // Если условные правила требуют блокировки, продолжаем проверку расписания
    }
    
    // Проверяем расписание
    if (!site.schedule || typeof isScheduleActive !== 'function') {
      return true; // Блокируем всегда если нет расписания
    }
    
    return isScheduleActive(site.schedule);
  });
  
  // Сохраняем условные правила в результате для отслеживания
  activeSites.forEach(site => {
    const originalSite = sites.find(s => {
      const normalizeFn = typeof self !== 'undefined' && self.utils && self.utils.normalizeHost 
        ? self.utils.normalizeHost 
        : null;
      const normalizedHost = normalizeFn ? normalizeFn(site.host) : site.host.toLowerCase().replace(/^www\./, "");
      const originalNormalizedHost = normalizeFn ? normalizeFn(s.host) : s.host.toLowerCase().replace(/^www\./, "");
      return normalizedHost === originalNormalizedHost;
    });
    if (originalSite && originalSite.conditionalRules) {
      site.conditionalRules = originalSite.conditionalRules;
    }
  });
  
  // Если активна Pomodoro-сессия, добавляем сайты из списка сессии
  if (isFocusSessionActive && activeFocusSessionSites.size > 0) {
    const pomodoroSites = Array.from(activeFocusSessionSites).map(host => ({
      host: host,
      addedAt: Date.now(),
      category: null,
      schedule: null,
      conditionalRules: null
    }));
    
    // Объединяем основной список и Pomodoro список, убирая дубликаты
    const allSitesMap = new Map();
    
    // Добавляем активные сайты из основного списка
    activeSites.forEach(site => {
      const normalizedHost = normalizeFn ? normalizeFn(site.host) : site.host.toLowerCase().replace(/^www\./, "");
      if (normalizedHost) {
        allSitesMap.set(normalizedHost, site);
      }
    });
    
    // Добавляем сайты из Pomodoro списка (если их еще нет)
    pomodoroSites.forEach(site => {
      const normalizedHost = normalizeFn ? normalizeFn(site.host) : site.host.toLowerCase().replace(/^www\./, "");
      if (normalizedHost && !allSitesMap.has(normalizedHost)) {
        allSitesMap.set(normalizedHost, site);
      }
    });
    
    return Array.from(allSitesMap.values());
  }
  
  return activeSites;
}

// Валидация правила перед применением
function validateRule(rule) {
  try {
    // Проверяем наличие обязательных полей
    if (!rule.id || typeof rule.id !== 'number') {
      return { valid: false, error: 'Invalid rule ID' };
    }
    if (!rule.condition || !rule.condition.regexFilter) {
      return { valid: false, error: 'Missing regexFilter' };
    }
    if (!rule.action || !rule.action.type) {
      return { valid: false, error: 'Missing action type' };
    }
    
    // Проверяем валидность regex
    try {
      new RegExp(rule.condition.regexFilter);
    } catch (regexErr) {
      return { valid: false, error: `Invalid regex: ${regexErr.message}` };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Validation error: ${err.message}` };
  }
}

// Блокировка для предотвращения одновременных вызовов rebuildRules
let rebuildRulesInProgress = false;
let rebuildRulesQueue = [];

async function rebuildRules() {
  // Если уже выполняется перестройка, добавляем в очередь
  if (rebuildRulesInProgress) {
    return new Promise((resolve) => {
      rebuildRulesQueue.push(resolve);
    });
  }
  
  rebuildRulesInProgress = true;
  
  try {
    // Получаем только активные сайты (с учетом расписания)
    // #region agent log
    if (typeof self !== 'undefined' && self.fetch) {
      self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:319',message:'rebuildRules calling getActiveBlockedSites',data:{hasConditionalRules:typeof self !== 'undefined' && !!self.conditionalRules},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    }
    // #endregion
    const sites = await getActiveBlockedSites();
    const hosts = sites.map(s => s.host).filter(Boolean);
    // #region agent log
    console.log('[DEBUG] rebuildRules got active sites:', {sitesCount:sites.length,hosts:hosts.slice(0,5),sites:sites.slice(0,3).map(s=>({host:s.host,hasConditionalRules:!!s.conditionalRules,conditionalRules:s.conditionalRules}))});
    if (typeof self !== 'undefined' && self.fetch) {
      self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:321',message:'rebuildRules got active sites',data:{sitesCount:sites.length,hosts:hosts.slice(0,5),sites:sites.slice(0,3).map(s=>({host:s.host,hasConditionalRules:!!s.conditionalRules,conditionalRules:s.conditionalRules}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    }
    // #endregion
    console.log('[Brain Defender] Rebuilding rules for sites:', hosts);

    if (hosts.length === 0) {
      console.log('[Brain Defender] No sites to block, removing all rules');
      try {
        const existing = await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = existing.map(r => r.id);
        if (removeRuleIds.length > 0) {
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds,
            addRules: []
          });
        }
        await chrome.action.setBadgeText({ text: "" });
      } catch (err) {
        console.error("[Brain Defender] Ошибка при удалении правил:", err);
        throw err;
      }
      return { success: true, rulesCount: 0 };
    }

    // Проверяем лимит правил
    const MAX_RULES = 30000;
    if (hosts.length > MAX_RULES) {
      const error = `Превышен лимит правил: ${hosts.length} > ${MAX_RULES}`;
      console.error(`[Brain Defender] ${error}`);
      throw new Error(error);
    }

    let existing = [];
    try {
      existing = await chrome.declarativeNetRequest.getDynamicRules();
    } catch (err) {
      console.error("[Brain Defender] Ошибка при получении существующих правил:", err);
      throw err;
    }
    
    // Упрощенное инкрементальное обновление
    // Если количество правил сильно изменилось, делаем полную перестройку
    // Иначе удаляем все и добавляем только нужные (все равно быстрее чем полная перестройка при малых изменениях)
    const changeRatio = existing.length > 0 
      ? Math.abs(hosts.length - existing.length) / existing.length 
      : 1;
    const useIncremental = changeRatio <= 0.3 && existing.length > 10;
    
    let removeRuleIds;
    if (useIncremental) {
      // Для инкрементального обновления удаляем все существующие правила
      // и добавляем только новые (это все равно быстрее при малых изменениях)
      console.log('[Brain Defender] Using incremental update');
      removeRuleIds = existing.map(r => r.id);
    } else {
      // Полная перестройка
      console.log('[Brain Defender] Using full rebuild');
      removeRuleIds = existing.map(r => r.id);
    }

    const blockedBase = chrome.runtime.getURL("blocked.html");
    if (!blockedBase) {
      throw new Error('Failed to get blocked.html URL');
    }
    console.log('[Brain Defender] Blocked page URL:', blockedBase);
    
    const addRules = [];
    const validationErrors = [];
    
    // Определяем следующий доступный ID для новых правил
    const maxExistingId = existing.length > 0 
      ? Math.max(...existing.map(r => r.id)) 
      : 0;
    let nextRuleId = Math.max(maxExistingId + 1, 1);
    
    // Получаем функцию hostToRegex из utils.js или используем fallback
    const hostToRegexFn = typeof self !== 'undefined' && self.utils && self.utils.hostToRegex 
      ? self.utils.hostToRegex 
      : function(host) {
          // Fallback функция если utils.js не загружен
          const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const h = escapeRegex(host);
          return `^(https?:\\/\\/(?:[^\\/]*\\.)?${h}(?:\\/.*)?)$`;
        };
    
    for (let idx = 0; idx < hosts.length; idx++) {
      const host = hosts[idx];
      const regex = hostToRegexFn(host);
      
      const rule = {
        id: nextRuleId++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: `${blockedBase}?url=\\1`
          }
        },
        condition: {
          regexFilter: regex,
          resourceTypes: ["main_frame"]
        }
      };
      
      // Валидация правила
      const validation = validateRule(rule);
      if (!validation.valid) {
        console.error(`[Brain Defender] Invalid rule for ${host}:`, validation.error);
        validationErrors.push({ host, error: validation.error });
        continue;
      }
      
      addRules.push(rule);
    }
    
    if (validationErrors.length > 0) {
      console.warn(`[Brain Defender] ${validationErrors.length} rules failed validation:`, validationErrors);
    }

    if (addRules.length === 0) {
      console.warn('[Brain Defender] No valid rules to add');
      return { success: false, error: 'No valid rules to add', validationErrors };
    }

    console.log('[Brain Defender] Adding', addRules.length, 'valid rules');
    
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules
      });
    } catch (err) {
      console.error("[Brain Defender] Ошибка при применении правил:", err);
      // Fallback: пытаемся применить правила по одному
      console.log('[Brain Defender] Attempting fallback: applying rules one by one');
      const fallbackResults = [];
      // В fallback режиме сначала удаляем все старые правила, затем добавляем новые по одному
      // Получаем текущие правила для удаления
      let currentRulesForRemoval = [];
      try {
        currentRulesForRemoval = await chrome.declarativeNetRequest.getDynamicRules();
      } catch (getErr) {
        console.warn('[Brain Defender] Failed to get rules for fallback removal:', getErr);
      }
      
      const removeRuleIdsForFallback = currentRulesForRemoval.map(r => r.id);
      
      for (const rule of addRules) {
        try {
          // Удаляем правило с таким же ID, если оно существует, перед добавлением нового
          const ruleIdsToRemove = removeRuleIdsForFallback.filter(id => id === rule.id);
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove,
            addRules: [rule]
          });
          // Удаляем ID из списка для удаления, чтобы не пытаться удалить его повторно
          removeRuleIdsForFallback.splice(removeRuleIdsForFallback.indexOf(rule.id), 1);
          fallbackResults.push({ ruleId: rule.id, success: true });
        } catch (fallbackErr) {
          console.error(`[Brain Defender] Failed to apply rule ${rule.id}:`, fallbackErr);
          fallbackResults.push({ ruleId: rule.id, success: false, error: fallbackErr.message });
        }
      }
      const successCount = fallbackResults.filter(r => r.success).length;
      console.log(`[Brain Defender] Fallback applied ${successCount}/${addRules.length} rules`);
      
      if (successCount === 0) {
        throw new Error('Failed to apply any rules, even with fallback');
      }
    }
    
    console.log('[Brain Defender] Rules updated successfully');
    
    // Проверяем, что правила действительно применены
    let verifyRules = [];
    try {
      verifyRules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('[Brain Defender] Verified rules count:', verifyRules.length);
      if (verifyRules.length !== addRules.length) {
        console.warn(`[Brain Defender] Rule count mismatch: expected ${addRules.length}, got ${verifyRules.length}`);
      }
    } catch (err) {
      console.warn('[Brain Defender] Failed to verify rules:', err);
    }

    // бейдж с количеством
    try {
      await chrome.action.setBadgeText({ text: hosts.length ? String(hosts.length) : "" });
    } catch (err) {
      console.error("[Brain Defender] Ошибка при установке бейджа:", err);
      // Не критично, продолжаем
    }
    
    const result = { 
      success: true, 
      rulesCount: verifyRules.length || addRules.length,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    };
    
    // Разблокируем и обрабатываем очередь
    rebuildRulesInProgress = false;
    if (rebuildRulesQueue.length > 0) {
      const nextResolve = rebuildRulesQueue.shift();
      // Запускаем следующую перестройку
      rebuildRules().then(nextResolve).catch(nextResolve);
    }
    
    return result;
  } catch (err) {
    console.error("[Brain Defender] Критическая ошибка при перестройке правил:", err);
    console.error("[Brain Defender] Error details:", err.message, err.stack);
    
    // Сохраняем информацию об ошибке для диагностики
    try {
      await chrome.storage.local.set({ 
        lastRebuildError: {
          message: err.message,
          stack: err.stack,
          timestamp: Date.now()
        }
      });
    } catch (storageErr) {
      console.error("[Brain Defender] Failed to save error info:", storageErr);
    }
    
    // Разблокируем и обрабатываем очередь даже при ошибке
    rebuildRulesInProgress = false;
    if (rebuildRulesQueue.length > 0) {
      const nextResolve = rebuildRulesQueue.shift();
      // Запускаем следующую перестройку
      rebuildRules().then(nextResolve).catch(nextResolve);
    }
    
    return { success: false, error: err.message };
  }
}

function isBlockedUrl(urlStr, blockedHosts) {
  // Используем функцию из utils.js, если доступна
  if (typeof self !== 'undefined' && self.utils && self.utils.isBlockedUrl) {
    return self.utils.isBlockedUrl(urlStr, blockedHosts);
  }
  // Fallback для случая, если utils не загружен
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = (u.hostname || "").toLowerCase().replace(/^www\./, "");
    return blockedHosts.some(b => {
      const blockedHost = typeof b === 'string' ? b : (b.host || b);
      return host === blockedHost || host.endsWith("." + blockedHost);
    });
  } catch {
    return false;
  }
}

// анти-спам уведомлений
const lastNotifByTab = new Map();
const MAX_NOTIF_MAP_SIZE = 1000; // Ограничение размера для предотвращения утечки памяти

function shouldNotify(tabId) {
  const now = Date.now();
  const last = lastNotifByTab.get(tabId) || 0;
  if (now - last < 2500) return false;
  
  // Очистка старых записей при превышении лимита
  if (lastNotifByTab.size >= MAX_NOTIF_MAP_SIZE) {
    // Удаляем самые старые записи (первые 100)
    const entries = Array.from(lastNotifByTab.entries());
    entries.slice(0, 100).forEach(([key]) => lastNotifByTab.delete(key));
  }
  
  lastNotifByTab.set(tabId, now);
  return true;
}

async function maybeNotify(details) {
  try {
    if (details.frameId !== 0) return; // только main frame
    const tabId = details.tabId;
    if (tabId == null || tabId < 0) return;

    const sites = await getActiveBlockedSites();
    const hosts = sites.map(s => s.host);
    if (!isBlockedUrl(details.url, hosts)) return;
    
    // Регистрируем блокировку в статистике
    try {
      const url = new URL(details.url);
      const host = (url.hostname || "").toLowerCase().replace(/^www\./, "");
      if (typeof recordBlock === 'function') {
        await recordBlock(host);
      }
    } catch (statsErr) {
      console.debug("Не удалось зарегистрировать блокировку в статистике:", statsErr);
    }
    
    if (!shouldNotify(tabId)) return;

    const phrases = await getNotificationPhrases();
    const msg = phrases[Math.floor(Math.random() * phrases.length)];
    const title = await getNotificationTitle();
    const iconUrl = chrome.runtime.getURL("icons/icon128.png");

    await chrome.notifications.create(`prehint_${tabId}_${Date.now()}`, {
      type: "basic",
      iconUrl,
      title: title,
      message: msg,
      priority: 2
    });
  } catch (err) {
    // Тихая ошибка - уведомления не критичны
    console.debug("Не удалось создать уведомление:", err);
  }
}

// Настройка alarm для автоматической проверки расписания
function setupScheduleAlarm() {
  try {
    // Устанавливаем alarm на каждую минуту для проверки изменений расписания
    chrome.alarms.create('checkSchedule', {
      delayInMinutes: 1,
      periodInMinutes: 1
    });
    console.log('[Brain Defender] Schedule alarm set up');
  } catch (err) {
    console.error('[Brain Defender] Error setting up schedule alarm:', err);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Выполняем миграцию данных
    if (typeof migrateData === 'function') {
      const migrationResult = await migrateData();
      console.log('[Brain Defender] Migration result:', migrationResult);
    }
    
    const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
    if (!Array.isArray(data[STORAGE_KEY])) {
      await chrome.storage.sync.set({ [STORAGE_KEY]: [] });
    }
    
    // Инициализируем статистику
    if (typeof initStats === 'function') {
      await initStats();
    }
    
    await rebuildRules();
    
    // Устанавливаем alarm для проверки расписания
    setupScheduleAlarm();
  } catch (err) {
    console.error("Ошибка при установке расширения:", err);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await rebuildRules();
    // Устанавливаем alarm для проверки расписания
    setupScheduleAlarm();
  } catch (err) {
    console.error("Ошибка при запуске расширения:", err);
  }
});

// Обработчик alarm для проверки расписания и временных исключений
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkSchedule') {
    try {
      // Проверяем, нужно ли перестроить правила из-за изменения расписания
      const sites = await getBlockedSites();
      const activeSites = await getActiveBlockedSites();
      
      // Если количество активных сайтов изменилось, перестраиваем правила
      // Это упрощенная проверка - можно улучшить, сравнивая конкретные сайты
      const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
      
      if (currentRules.length !== activeSites.length) {
        console.log('[Brain Defender] Schedule changed, rebuilding rules');
        await rebuildRules();
      }
    } catch (err) {
      console.error('[Brain Defender] Error checking schedule:', err);
    }
  } else if (alarm.name === 'focusSession') {
    // Pomodoro-сессия завершилась автоматически
    try {
      console.log('[Brain Defender] Focus session ended (alarm), clearing Pomodoro sites');
      activeFocusSessionSites = null;
      focusSessionEndTime = null;
      await rebuildRules();
      
      // Отправляем уведомление пользователю
      try {
        const phrases = await getNotificationPhrases();
        const msg = phrases[Math.floor(Math.random() * phrases.length)];
        const title = await getNotificationTitle();
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: '🍅 Фокус-сессия завершена!',
          message: 'Отличная работа! Время для небольшого перерыва.',
          priority: 2
        });
      } catch (notifErr) {
        console.debug('[Brain Defender] Failed to show notification:', notifErr);
      }
    } catch (err) {
      console.error('[Brain Defender] Error handling focus session alarm:', err);
    }
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  console.log('[DEBUG] Storage changed:', areaName, changes);
  
  // Если изменилась статистика (local storage), проверяем, нужно ли перестроить правила
  // для условных правил, которые зависят от статистики посещений
  if (areaName === "local" && changes[STATS_STORAGE_KEY]) {
    console.log('[DEBUG] Stats changed, checking for conditional rules');
    try {
      // Проверяем, есть ли сайты с условными правилами
      const sites = await getBlockedSites();
      console.log('[DEBUG] All sites:', sites.map(s => ({host: s.host, hasConditionalRules: !!(s.conditionalRules && Array.isArray(s.conditionalRules) && s.conditionalRules.length > 0)})));
      const hasConditionalRules = sites.some(site => site.conditionalRules && Array.isArray(site.conditionalRules) && site.conditionalRules.length > 0);
      console.log('[DEBUG] Has conditional rules:', hasConditionalRules);
      
      if (hasConditionalRules) {
        console.log('[DEBUG] Rebuilding rules for conditional rules');
        // #region agent log
        if (typeof self !== 'undefined' && self.fetch) {
          self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service_worker.js:774',message:'Stats changed, rebuilding rules for conditional rules',data:{hasConditionalRules},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        }
        // #endregion
        // Перестраиваем правила, чтобы применить условные правила с учетом новой статистики
        await rebuildRules();
      }
    } catch (err) {
      console.error('[Brain Defender] Error rebuilding rules after stats change:', err);
    }
  }
  
  if (areaName !== "sync") return;
  if (changes[STORAGE_KEY]) {
    console.log('Blocked sites changed, oldValue:', changes[STORAGE_KEY].oldValue, 'newValue:', changes[STORAGE_KEY].newValue);
    try {
      await rebuildRules();
    } catch (err) {
      console.error("Ошибка при изменении хранилища:", err);
      console.error("Error details:", err.message, err.stack);
    }
  }
});

// Обработчик сообщений для диагностики и временных исключений
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'rebuildRules') {
    rebuildRules().then(result => {
      sendResponse(result);
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // Асинхронный ответ
  }
  
  if (request.action === 'blockSitesForSession') {
    // Сохраняем список сайтов для Pomodoro-сессии
    const normalizeFn = typeof self !== 'undefined' && self.utils && self.utils.normalizeHost 
      ? self.utils.normalizeHost 
      : null;
    
    activeFocusSessionSites = new Set();
    if (request.sites && Array.isArray(request.sites)) {
      request.sites.forEach(host => {
        const normalized = normalizeFn ? normalizeFn(host) : host.toLowerCase().replace(/^www\./, "");
        if (normalized) {
          activeFocusSessionSites.add(normalized);
        }
      });
    }
    
    focusSessionEndTime = request.until || (Date.now() + 25 * 60 * 1000); // По умолчанию 25 минут
    
    console.log('[Brain Defender] Focus session started, blocking sites:', Array.from(activeFocusSessionSites));
    
    rebuildRules().then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (request.action === 'unblockSitesForSession') {
    // Очищаем список Pomodoro-сессии
    activeFocusSessionSites = null;
    focusSessionEndTime = null;
    
    console.log('[Brain Defender] Focus session ended, clearing Pomodoro sites');
    
    rebuildRules().then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});

// Восстановление состояния Pomodoro-сессии при перезапуске service worker
async function restoreFocusSessionState() {
  try {
    if (typeof self !== 'undefined' && self.focusSessions && self.focusSessions.getCurrentSession) {
      const session = await self.focusSessions.getCurrentSession();
      if (session && session.state === 'working' && session.sitesToBlock) {
        // Восстанавливаем состояние Pomodoro-сессии
        const normalizeFn = typeof self !== 'undefined' && self.utils && self.utils.normalizeHost 
          ? self.utils.normalizeHost 
          : null;
        
        activeFocusSessionSites = new Set();
        if (session.sitesToBlock && Array.isArray(session.sitesToBlock)) {
          session.sitesToBlock.forEach(host => {
            const normalized = normalizeFn ? normalizeFn(host) : host.toLowerCase().replace(/^www\./, "");
            if (normalized) {
              activeFocusSessionSites.add(normalized);
            }
          });
        }
        
        focusSessionEndTime = session.endTime || null;
        
        console.log('[Brain Defender] Restored focus session state:', {
          sitesCount: activeFocusSessionSites.size,
          endTime: focusSessionEndTime
        });
        
        // Перестраиваем правила
        await rebuildRules();
      }
    }
  } catch (err) {
    console.error('[Brain Defender] Error restoring focus session state:', err);
  }
}

// Восстанавливаем состояние при инициализации
restoreFocusSessionState();

// мини-подсказка до перехода
// Отслеживание посещений сайтов с условными правилами для динамической проверки
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    if (details.frameId !== 0) return; // только main frame
    
    const url = new URL(details.url);
    const host = (url.hostname || "").toLowerCase().replace(/^www\./, "");
    
    // Проверяем, есть ли у этого сайта условные правила
    const sites = await getBlockedSites();
    const site = sites.find(s => {
      const normalizeFn = typeof self !== 'undefined' && self.utils && self.utils.normalizeHost 
        ? self.utils.normalizeHost 
        : null;
      const normalizedHost = normalizeFn ? normalizeFn(s.host) : s.host.toLowerCase().replace(/^www\./, "");
      return normalizedHost === host;
    });
    
    if (site && site.conditionalRules && Array.isArray(site.conditionalRules) && site.conditionalRules.length > 0) {
      console.log('[DEBUG] Tracking visit for site with conditional rules:', {host, conditionalRules: site.conditionalRules});
      // Регистрируем посещение для статистики
      if (typeof recordBlock === 'function') {
        console.log('[DEBUG] Recording visit for:', host);
        await recordBlock(host);
        console.log('[DEBUG] Visit recorded, stats should update');
      }
      
      // Проверяем, нужно ли заблокировать сайт после этого посещения
      // Правила будут перестроены автоматически через chrome.storage.onChanged
      // когда статистика обновится
    }
  } catch (err) {
    console.debug('[Brain Defender] Error tracking visit for conditional rules:', err);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // fire-and-forget (service worker), но аккуратно
  maybeNotify(details).catch(err => {
    console.error("Ошибка при отправке уведомления:", err);
  });
});