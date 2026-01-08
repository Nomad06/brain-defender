// I18N_STORAGE_KEY загружается из consts.js

let currentLanguage = null;
let translations = null;

// Инициализация i18n - должна быть вызвана после загрузки translations.js
async function initI18n() {
  if (typeof TRANSLATIONS === 'undefined') {
    console.error('TRANSLATIONS not loaded');
    return;
  }
  translations = TRANSLATIONS;
  
  currentLanguage = await getLanguage();
  applyLanguage();
}

// Получение текущего языка (унифицированная логика для страниц и service worker)
async function getLanguage() {
  try {
    // Пробуем получить сохраненный язык
    const data = await chrome.storage.local.get({ [I18N_STORAGE_KEY]: null });
    if (data[I18N_STORAGE_KEY]) {
      return data[I18N_STORAGE_KEY];
    }
    
    // Автоопределение из браузера
    let browserLang = null;
    try {
      if (typeof navigator !== 'undefined' && navigator.language) {
        browserLang = navigator.language || navigator.userLanguage;
      } else if (typeof chrome !== 'undefined' && chrome.i18n) {
        // Для service worker используем chrome.i18n API
        browserLang = chrome.i18n.getUILanguage();
      }
    } catch {
      // Игнорируем ошибки получения языка браузера
    }
    
    if (browserLang && browserLang.startsWith('ru')) {
      return 'ru';
    }
    
    // Fallback на английский
    return 'en';
  } catch (err) {
    console.error('Error getting language:', err);
    return 'en';
  }
}

// Установка языка
async function setLanguage(lang) {
  if (!translations || !translations[lang]) {
    console.error('Invalid language:', lang);
    return;
  }
  
  try {
    await chrome.storage.local.set({ [I18N_STORAGE_KEY]: lang });
    currentLanguage = lang;
    applyLanguage();
    
    // Перезагружаем страницу для применения изменений
    if (typeof location !== 'undefined') {
      location.reload();
    }
  } catch (err) {
    console.error('Error setting language:', err);
  }
}

// Получение перевода по ключу (например, 'blocked.title' или 'options.addButton')
function t(key, params = {}) {
  if (!translations || !currentLanguage) {
    return key;
  }
  
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Замена параметров {param}
  return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
    return params[paramKey] !== undefined ? params[paramKey] : match;
  });
}

// Получение массива фраз для типа (blocked/notifications)
function getPhrases(type) {
  if (!translations || !currentLanguage) {
    return [];
  }
  
  if (type === 'blocked' && translations[currentLanguage].blocked) {
    return translations[currentLanguage].blocked.phrases || [];
  }
  
  if (type === 'notifications' && translations[currentLanguage].notifications) {
    return translations[currentLanguage].notifications.phrases || [];
  }
  
  return [];
}

// Применение языка к странице
function applyLanguage() {
  if (!currentLanguage || typeof document === 'undefined') {
    return;
  }
  
  // Устанавливаем lang атрибут
  if (document.documentElement) {
    document.documentElement.lang = currentLanguage;
  }
  
  // Обновляем элементы с data-i18n атрибутом
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const paramsAttr = el.getAttribute('data-i18n-params');
    let params = {};
    if (paramsAttr) {
      try {
        params = JSON.parse(paramsAttr);
      } catch (e) {
        console.error('Invalid data-i18n-params:', paramsAttr);
      }
    }
    const text = t(key, params);
    if (text && text !== key) {
      if (el.tagName === 'INPUT' && (el.hasAttribute('placeholder') || el.hasAttribute('data-i18n-placeholder'))) {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });
  
  // Обновляем элементы с data-i18n-placeholder атрибутом
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text && text !== key) {
      el.placeholder = text;
    }
  });
  
  // Обновляем title
  const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
  if (titleKey) {
    const title = t(titleKey);
    if (title && title !== titleKey) {
      document.title = title;
    }
  }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.i18n = {
    init: initI18n,
    getLanguage,
    setLanguage,
    t,
    getPhrases,
    applyLanguage,
    getCurrentLanguage: () => currentLanguage
  };
}

// Для service worker (если нужно)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.i18n = {
    getLanguage,
    setLanguage,
    t,
    getPhrases,
    getCurrentLanguage: () => currentLanguage
  };
}

