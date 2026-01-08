// Утилиты для работы с доменами и URL
// Используется во всех модулях расширения

/**
 * Нормализует домен из строки (URL или домен)
 * Обрабатывает IDN домены, IP-адреса, порты и специальные символы
 * @param {string} input - URL или домен для нормализации
 * @returns {string|null} - Нормализованный домен или null при ошибке
 */
function normalizeHost(input) {
  try {
    const trimmed = String(input || "").trim();
    if (!trimmed) return null;

    // Если пользователь ввёл без протокола
    const withProto = /^[a-zA-Z]+:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    
    let u;
    try {
      u = new URL(withProto);
    } catch (urlErr) {
      // Если не удалось распарсить как URL, пробуем как домен напрямую
      // Проверяем, не является ли это IP-адресом
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
        // IPv4 адрес
        return trimmed.toLowerCase();
      }
      
      // Проверяем IPv6 (упрощенная проверка)
      if (/^\[?[0-9a-fA-F:]+]?$/.test(trimmed)) {
        // IPv6 адрес (может быть в квадратных скобках)
        return trimmed.toLowerCase().replace(/[\[\]]/g, '');
      }
      
      // Если это не URL и не IP, пробуем как домен
      const domainOnly = trimmed.toLowerCase().replace(/^www\./, "");
      
      // Валидация домена: проверяем на недопустимые символы
      // Допустимы: буквы, цифры, точки, дефисы (но не в начале/конце)
      if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(domainOnly)) {
        return null;
      }
      
      // Проверка на пробелы и другие недопустимые символы
      if (domainOnly.includes(" ") || domainOnly.length > 253) {
        return null;
      }
      
      return domainOnly;
    }

    let host = (u.hostname || "").toLowerCase();
    
    // Обработка IDN доменов (punycode уже декодирован браузером в hostname)
    // Но если hostname содержит punycode (xn--), оставляем как есть
    // Браузер сам обработает IDN при парсинге URL
    
    // Убираем www. префикс
    host = host.replace(/^www\./, "");
    
    // Проверка на пустой host
    if (!host) return null;
    
    // Проверка на пробелы и другие недопустимые символы в домене
    if (host.includes(" ") || host.length > 253) {
      return null;
    }
    
    // Валидация формата домена (базовая проверка)
    // Допустимы: буквы, цифры, точки, дефисы
    // Но не должны начинаться/заканчиваться дефисом или точкой
    if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(host)) {
      return null;
    }
    
    // Проверка на специальные случаи (например, example.com.co не должен блокировать .co)
    // Это обрабатывается на уровне regex в hostToRegex()
    
    return host;
  } catch (err) {
    console.error('[Utils] Error normalizing host:', input, err);
    return null;
  }
}

/**
 * Экранирует специальные символы для использования в regex
 * @param {string} s - Строка для экранирования
 * @returns {string} - Экранированная строка
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Преобразует домен в regex паттерн для блокировки домена и всех поддоменов
 * @param {string} host - Домен для блокировки
 * @returns {string} - Regex паттерн
 */
function hostToRegex(host) {
  const h = escapeRegex(host);
  // group1 = полный URL
  // Паттерн: (https?://) + (опциональный поддомен с точкой) + домен + (опциональный путь)
  // Пример для youtube.com: ^(https?:\/\/(?:[^\/]*\.)?youtube\.com(?:\/.*)?)$
  // Важно: используем [^\/]* вместо .* чтобы не захватывать другие домены через слеш
  const regex = `^(https?:\\/\\/(?:[^\\/]*\\.)?${h}(?:\\/.*)?)$`;
  return regex;
}

/**
 * Проверяет, является ли URL заблокированным
 * @param {string} urlStr - URL для проверки
 * @param {Array<string|object>} blockedHosts - Массив заблокированных доменов
 * @returns {boolean} - true если URL заблокирован
 */
function isBlockedUrl(urlStr, blockedHosts) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = (u.hostname || "").toLowerCase().replace(/^www\./, "");
    
    return blockedHosts.some(b => {
      const blockedHost = typeof b === 'string' ? b : (b.host || b);
      const normalizedBlocked = String(blockedHost).toLowerCase().replace(/^www\./, "");
      
      // Точное совпадение или поддомен
      return host === normalizedBlocked || host.endsWith("." + normalizedBlocked);
    });
  } catch {
    return false;
  }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.utils = {
    normalizeHost,
    escapeRegex,
    hostToRegex,
    isBlockedUrl
  };
}

// Для service worker (где window не определен)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.utils = {
    normalizeHost,
    escapeRegex,
    hostToRegex,
    isBlockedUrl
  };
}

