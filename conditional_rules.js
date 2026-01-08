// Система условных правил блокировки
// Расширяет функциональность блокировки сайтов с условиями

// Типы условий
const CONDITION_TYPES = {
  VISITS_PER_DAY: 'visitsPerDay', // Блокировка после N посещений в день
  TIME_AFTER: 'timeAfter', // Блокировка только после определенного времени
  DAYS_OF_WEEK: 'daysOfWeek', // Блокировка только в определенные дни недели
  TIME_LIMIT: 'timeLimit' // Блокировка при превышении лимита времени на сайте
};

/**
 * Проверяет, должны ли применяться условные правила для сайта
 * @param {Object} site - Объект сайта с условными правилами
 * @param {Object} siteStats - Статистика по сайту из stats.js
 * @returns {boolean} - true если сайт должен быть заблокирован
 */
function shouldBlockByConditionalRules(site, siteStats) {
  // #region agent log
  const logData = {host:site?.host,hasConditionalRules:!!(site?.conditionalRules),rulesCount:site?.conditionalRules?.length||0,hasSiteStats:!!siteStats};
  if (typeof self !== 'undefined' && self.fetch) {
    self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:18',message:'shouldBlockByConditionalRules called',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  }
  // #endregion
  
  if (!site || !site.conditionalRules || !Array.isArray(site.conditionalRules) || site.conditionalRules.length === 0) {
    // #region agent log
    if (typeof self !== 'undefined' && self.fetch) {
      self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:20',message:'No conditional rules, blocking by default',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    }
    // #endregion
    return true; // Если нет условных правил, блокируем всегда
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ...
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // минуты с начала дня
  const today = now.toISOString().split('T')[0];
  
  // Проверяем каждое условие
  for (const rule of site.conditionalRules) {
    if (!rule.type || !rule.enabled) {
      // #region agent log
      if (typeof self !== 'undefined' && self.fetch) {
        self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:33',message:'Rule skipped',data:{type:rule.type,enabled:rule.enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      }
      // #endregion
      continue;
    }
    
    switch (rule.type) {
      case CONDITION_TYPES.VISITS_PER_DAY:
        // Блокировка после N посещений в день
        if (!rule.maxVisits) {
          break;
        }
        // Получаем количество посещений сегодня (0 если статистика отсутствует)
        const visitsToday = siteStats && siteStats.visitsByDate && siteStats.visitsByDate[today] 
          ? siteStats.visitsByDate[today] 
          : 0;
        // #region agent log
        if (typeof self !== 'undefined' && self.fetch) {
          self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:54',message:'Checking visitsPerDay rule',data:{maxVisits:rule.maxVisits,visitsToday,hasSiteStats:!!siteStats,hasVisitsByDate:!!(siteStats&&siteStats.visitsByDate),today,visitsByDate:siteStats?.visitsByDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        }
        // #endregion
        if (visitsToday >= rule.maxVisits) {
          // #region agent log
          if (typeof self !== 'undefined' && self.fetch) {
            self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:60',message:'Visits limit exceeded, blocking',data:{visitsToday,maxVisits:rule.maxVisits},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
          }
          // #endregion
          return true; // Превышен лимит посещений
        }
        // Если посещений меньше лимита, не блокируем (но продолжаем проверять другие правила, если они есть)
        // #region agent log
        if (typeof self !== 'undefined' && self.fetch) {
          self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:66',message:'Visits limit not exceeded, not blocking',data:{visitsToday,maxVisits:rule.maxVisits},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        }
        // #endregion
        // Для правила visitsPerDay: если посещений меньше лимита, не блокируем
        return false;
        
      case CONDITION_TYPES.TIME_AFTER:
        // Блокировка только после определенного времени
        if (rule.timeAfter) {
          const timeAfter = parseTime(rule.timeAfter); // минуты с начала дня
          if (currentTime >= timeAfter) {
            return true; // Время наступило
          } else {
            return false; // Еще рано, не блокируем
          }
        }
        break;
        
      case CONDITION_TYPES.DAYS_OF_WEEK:
        // Блокировка только в определенные дни недели
        if (rule.days && Array.isArray(rule.days) && rule.days.length > 0) {
          if (rule.days.includes(currentDay)) {
            return true; // Сегодня день блокировки
          } else {
            return false; // Сегодня не день блокировки
          }
        }
        break;
        
      case CONDITION_TYPES.TIME_LIMIT:
        // Блокировка при превышении лимита времени на сайте
        if (!rule.maxTimeMinutes) {
          break;
        }
        const timeSpentToday = siteStats && siteStats.timeSpentToday ? siteStats.timeSpentToday : 0;
        if (timeSpentToday >= rule.maxTimeMinutes) {
          return true; // Превышен лимит времени
        }
        // Если время не превышено, не блокируем
        return false;
    }
  }
  
  // Если ни одно условие не сработало, НЕ блокируем (условные правила не требуют блокировки)
  // #region agent log
  if (typeof self !== 'undefined' && self.fetch) {
    self.fetch('http://127.0.0.1:7243/ingest/0b2bd57b-7c75-4e3b-8e4c-756cc1ae3168',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conditional_rules.js:82',message:'No rule matched, not blocking',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  }
  // #endregion
  return false;
}

/**
 * Парсинг времени из строки "HH:MM" в минуты с начала дня
 */
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }
  
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    return 0;
  }
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    return 0;
  }
  
  return hours * 60 + minutes;
}

/**
 * Создает правило по умолчанию
 */
function createDefaultConditionalRule(type) {
  const defaults = {
    [CONDITION_TYPES.VISITS_PER_DAY]: {
      type: CONDITION_TYPES.VISITS_PER_DAY,
      enabled: false,
      maxVisits: 5
    },
    [CONDITION_TYPES.TIME_AFTER]: {
      type: CONDITION_TYPES.TIME_AFTER,
      enabled: false,
      timeAfter: '22:00'
    },
    [CONDITION_TYPES.DAYS_OF_WEEK]: {
      type: CONDITION_TYPES.DAYS_OF_WEEK,
      enabled: false,
      days: [0, 6] // Выходные по умолчанию
    },
    [CONDITION_TYPES.TIME_LIMIT]: {
      type: CONDITION_TYPES.TIME_LIMIT,
      enabled: false,
      maxTimeMinutes: 60 // 1 час по умолчанию
    }
  };
  
  return defaults[type] || null;
}

/**
 * Валидация условного правила
 */
function validateConditionalRule(rule) {
  if (!rule || typeof rule !== 'object') {
    return { valid: false, error: 'Rule must be an object' };
  }
  
  if (!rule.type || !Object.values(CONDITION_TYPES).includes(rule.type)) {
    return { valid: false, error: 'Invalid rule type' };
  }
  
  switch (rule.type) {
    case CONDITION_TYPES.VISITS_PER_DAY:
      if (rule.maxVisits !== undefined && (typeof rule.maxVisits !== 'number' || rule.maxVisits < 1)) {
        return { valid: false, error: 'maxVisits must be a positive number' };
      }
      break;
      
    case CONDITION_TYPES.TIME_AFTER:
      if (!rule.timeAfter || typeof rule.timeAfter !== 'string') {
        return { valid: false, error: 'timeAfter must be a string in HH:MM format' };
      }
      const time = parseTime(rule.timeAfter);
      if (time === 0 && rule.timeAfter !== '00:00') {
        return { valid: false, error: 'Invalid time format' };
      }
      break;
      
    case CONDITION_TYPES.DAYS_OF_WEEK:
      if (!Array.isArray(rule.days) || rule.days.some(day => day < 0 || day > 6)) {
        return { valid: false, error: 'days must be an array of numbers 0-6' };
      }
      break;
      
    case CONDITION_TYPES.TIME_LIMIT:
      if (rule.maxTimeMinutes !== undefined && (typeof rule.maxTimeMinutes !== 'number' || rule.maxTimeMinutes < 1)) {
        return { valid: false, error: 'maxTimeMinutes must be a positive number' };
      }
      break;
  }
  
  return { valid: true };
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.conditionalRules = {
    CONDITION_TYPES,
    shouldBlockByConditionalRules,
    createDefaultConditionalRule,
    validateConditionalRule,
    parseTime
  };
}

// Для service worker (где window не определен)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.conditionalRules = {
    CONDITION_TYPES,
    shouldBlockByConditionalRules,
    createDefaultConditionalRule,
    validateConditionalRule,
    parseTime
  };
}

