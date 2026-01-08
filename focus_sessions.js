// Система фокус-сессий (Pomodoro)
// FOCUS_SESSIONS_STORAGE_KEY загружается из consts.js или определяется здесь

if (typeof FOCUS_SESSIONS_STORAGE_KEY === 'undefined') {
  if (typeof window !== 'undefined') {
    var FOCUS_SESSIONS_STORAGE_KEY = "focusSessions";
  } else {
    var FOCUS_SESSIONS_STORAGE_KEY = "focusSessions";
  }
}

const DEFAULT_SESSION_DURATION = 25; // минуты
const DEFAULT_BREAK_DURATION = 5; // минуты
const ALARM_SESSION_NAME = 'focusSession';
const ALARM_BREAK_NAME = 'focusBreak';

// Состояния сессии
const SESSION_STATES = {
  IDLE: 'idle',
  WORKING: 'working',
  BREAK: 'break',
  PAUSED: 'paused'
};

/**
 * Инициализация системы фокус-сессий
 */
async function initFocusSessions() {
  try {
    const data = await chrome.storage.local.get({ [FOCUS_SESSIONS_STORAGE_KEY]: null });
    if (!data[FOCUS_SESSIONS_STORAGE_KEY]) {
      await chrome.storage.local.set({
        [FOCUS_SESSIONS_STORAGE_KEY]: {
          currentSession: null,
          settings: {
            workDuration: DEFAULT_SESSION_DURATION,
            breakDuration: DEFAULT_BREAK_DURATION,
            autoStartBreak: true,
            soundEnabled: true
          },
          history: [],
          stats: {
            totalSessions: 0,
            totalWorkTime: 0, // минуты
            totalBreakTime: 0 // минуты
          }
        }
      });
    }
  } catch (err) {
    console.error('[FocusSessions] Error initializing:', err);
  }
}

/**
 * Получает данные фокус-сессий
 */
async function getFocusSessionsData() {
  try {
    const data = await chrome.storage.local.get({ [FOCUS_SESSIONS_STORAGE_KEY]: null });
    if (!data[FOCUS_SESSIONS_STORAGE_KEY]) {
      await initFocusSessions();
      const freshData = await chrome.storage.local.get({ [FOCUS_SESSIONS_STORAGE_KEY]: null });
      return freshData[FOCUS_SESSIONS_STORAGE_KEY];
    }
    return data[FOCUS_SESSIONS_STORAGE_KEY];
  } catch (err) {
    console.error('[FocusSessions] Error getting data:', err);
    return null;
  }
}

/**
 * Сохраняет данные фокус-сессий
 */
async function saveFocusSessionsData(data) {
  try {
    await chrome.storage.local.set({ [FOCUS_SESSIONS_STORAGE_KEY]: data });
  } catch (err) {
    console.error('[FocusSessions] Error saving data:', err);
  }
}

/**
 * Запускает фокус-сессию
 * @param {number} durationMinutes - Длительность сессии в минутах
 * @param {Array} sitesToBlock - Список сайтов для блокировки на время сессии
 */
async function startFocusSession(durationMinutes = null, sitesToBlock = null) {
  try {
    const data = await getFocusSessionsData();
    if (!data) return false;
    
    const settings = data.settings || {};
    const duration = durationMinutes || settings.workDuration || DEFAULT_SESSION_DURATION;
    const startTime = Date.now();
    const endTime = startTime + (duration * 60 * 1000);
    
    const session = {
      id: `session_${startTime}`,
      state: SESSION_STATES.WORKING,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      sitesToBlock: sitesToBlock || [],
      pausedTime: 0,
      pausedAt: null
    };
    
    data.currentSession = session;
    await saveFocusSessionsData(data);
    
    // Устанавливаем alarm для окончания сессии
    chrome.alarms.create(ALARM_SESSION_NAME, {
      when: endTime
    });
    
    // Блокируем сайты на время сессии (отправляем всегда, даже если список пустой)
    // Service worker будет комбинировать основной список + Pomodoro список
    try {
      await chrome.runtime.sendMessage({
        action: 'blockSitesForSession',
        sites: sitesToBlock || [],
        until: endTime
      });
    } catch (err) {
      console.error('[FocusSessions] Error blocking sites:', err);
    }
    
    // Показываем уведомление
    try {
      await chrome.notifications.create(`focusSession_${startTime}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: '🍅 Фокус-сессия началась!',
        message: `Работайте ${duration} минут без отвлечений`,
        priority: 2
      });
    } catch (notifErr) {
      console.debug('[FocusSessions] Failed to show notification:', notifErr);
    }
    
    return true;
  } catch (err) {
    console.error('[FocusSessions] Error starting session:', err);
    return false;
  }
}

/**
 * Останавливает текущую фокус-сессию
 */
async function stopFocusSession() {
  try {
    const data = await getFocusSessionsData();
    if (!data || !data.currentSession) return false;
    
    const session = data.currentSession;
    const now = Date.now();
    const actualDuration = Math.floor((now - session.startTime - (session.pausedTime || 0)) / (60 * 1000));
    
    // Сохраняем сессию в историю
    if (!data.history) data.history = [];
    data.history.push({
      ...session,
      state: 'completed',
      actualDuration: actualDuration,
      completedAt: now
    });
    
    // Обновляем статистику
    if (!data.stats) data.stats = { totalSessions: 0, totalWorkTime: 0, totalBreakTime: 0 };
    data.stats.totalSessions = (data.stats.totalSessions || 0) + 1;
    data.stats.totalWorkTime = (data.stats.totalWorkTime || 0) + actualDuration;
    
    data.currentSession = null;
    await saveFocusSessionsData(data);
    
    // Удаляем alarm
    chrome.alarms.clear(ALARM_SESSION_NAME);
    chrome.alarms.clear(ALARM_BREAK_NAME);
    
    // Разблокируем сайты
    try {
      await chrome.runtime.sendMessage({
        action: 'unblockSitesForSession'
      });
    } catch (err) {
      console.debug('[FocusSessions] Error unblocking sites:', err);
    }
    
    return true;
  } catch (err) {
    console.error('[FocusSessions] Error stopping session:', err);
    return false;
  }
}

/**
 * Приостанавливает текущую сессию
 */
async function pauseFocusSession() {
  try {
    const data = await getFocusSessionsData();
    if (!data || !data.currentSession || data.currentSession.state !== SESSION_STATES.WORKING) {
      return false;
    }
    
    data.currentSession.state = SESSION_STATES.PAUSED;
    data.currentSession.pausedAt = Date.now();
    await saveFocusSessionsData(data);
    
    // Удаляем alarm (время не истечет пока на паузе)
    chrome.alarms.clear(ALARM_SESSION_NAME);
    
    return true;
  } catch (err) {
    console.error('[FocusSessions] Error pausing session:', err);
    return false;
  }
}

/**
 * Возобновляет приостановленную сессию
 */
async function resumeFocusSession() {
  try {
    const data = await getFocusSessionsData();
    if (!data || !data.currentSession || data.currentSession.state !== SESSION_STATES.PAUSED) {
      return false;
    }
    
    const session = data.currentSession;
    const pausedDuration = Date.now() - (session.pausedAt || Date.now());
    session.pausedTime = (session.pausedTime || 0) + pausedDuration;
    session.state = SESSION_STATES.WORKING;
    session.pausedAt = null;
    
    // Пересчитываем время окончания
    const remainingTime = session.endTime - Date.now() + session.pausedTime;
    session.endTime = Date.now() + remainingTime;
    
    await saveFocusSessionsData(data);
    
    // Устанавливаем alarm заново
    chrome.alarms.create(ALARM_SESSION_NAME, {
      when: session.endTime
    });
    
    return true;
  } catch (err) {
    console.error('[FocusSessions] Error resuming session:', err);
    return false;
  }
}

/**
 * Получает текущую сессию
 */
async function getCurrentSession() {
  try {
    const data = await getFocusSessionsData();
    return data?.currentSession || null;
  } catch (err) {
    console.error('[FocusSessions] Error getting current session:', err);
    return null;
  }
}

/**
 * Получает оставшееся время сессии в секундах
 */
async function getRemainingTime() {
  try {
    const session = await getCurrentSession();
    if (!session || session.state === SESSION_STATES.IDLE || session.state === SESSION_STATES.PAUSED) {
      return 0;
    }
    
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((session.endTime - now) / 1000));
    return remaining;
  } catch (err) {
    console.error('[FocusSessions] Error getting remaining time:', err);
    return 0;
  }
}

/**
 * Обновляет настройки фокус-сессий
 */
async function updateFocusSessionSettings(settings) {
  try {
    const data = await getFocusSessionsData();
    if (!data) return false;
    
    data.settings = { ...data.settings, ...settings };
    await saveFocusSessionsData(data);
    return true;
  } catch (err) {
    console.error('[FocusSessions] Error updating settings:', err);
    return false;
  }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.focusSessions = {
    initFocusSessions,
    startFocusSession,
    stopFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    getCurrentSession,
    getRemainingTime,
    getFocusSessionsData,
    updateFocusSessionSettings,
    SESSION_STATES
  };
}

// Для service worker (где window не определен)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.focusSessions = {
    initFocusSessions,
    startFocusSession,
    stopFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    getCurrentSession,
    getRemainingTime,
    getFocusSessionsData,
    updateFocusSessionSettings,
    SESSION_STATES
  };
  
  // Обработка alarm для автоматического завершения сессии в service worker
  if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === ALARM_SESSION_NAME) {
        try {
          const session = await getCurrentSession();
          if (session && session.state === SESSION_STATES.WORKING) {
            // Автоматически завершаем сессию
            await stopFocusSession();
            console.log('[FocusSessions] Session auto-completed via alarm');
          }
        } catch (err) {
          console.error('[FocusSessions] Error handling session alarm:', err);
        }
      }
    });
  }
}

