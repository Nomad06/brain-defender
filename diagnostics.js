// STORAGE_KEY загружается из consts.js
// Fallback только для service worker (где window не определен)
if (typeof window === 'undefined' && typeof STORAGE_KEY === 'undefined') {
  // В service worker используем var для глобальной области видимости
  var STORAGE_KEY = "blockedSites";
}

async function getBlockedSites() {
  try {
    const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
    const raw = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    return raw;
  } catch (err) {
    console.error('Error getting blocked sites:', err);
    return [];
  }
}

async function getActiveRules() {
  try {
    return await chrome.declarativeNetRequest.getDynamicRules();
  } catch (err) {
    console.error('Error getting active rules:', err);
    return [];
  }
}

// Вспомогательная функция для нормализации доменов (использует utils.js если доступен)
function normalizeHost(input) {
  if (window.utils && window.utils.normalizeHost) {
    return window.utils.normalizeHost(input);
  }
  // Fallback для случая, если utils.js не загружен
  try {
    const trimmed = String(input || "").trim();
    if (!trimmed) return null;
    const withProto = /^[a-zA-Z]+:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    let host = (u.hostname || "").toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

function isBlockedUrl(urlStr, blockedHosts) {
  // Используем функцию из utils.js, если доступна
  if (window.utils && window.utils.isBlockedUrl) {
    return window.utils.isBlockedUrl(urlStr, blockedHosts);
  }
  // Fallback для случая, если utils.js не загружен
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

function testUrlAgainstRules(url, rules) {
  const results = [];
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.condition.regexFilter);
      const matches = regex.test(url);
      results.push({
        ruleId: rule.id,
        matches,
        regex: rule.condition.regexFilter
      });
    } catch (err) {
      results.push({
        ruleId: rule.id,
        matches: false,
        error: err.message,
        regex: rule.condition.regexFilter
      });
    }
  }
  return results;
}

async function updateStatus() {
  const statusEl = document.getElementById('status');
  const rulesListEl = document.getElementById('rulesList');
  const sitesListEl = document.getElementById('sitesList');
  const lastErrorEl = document.getElementById('lastError');
  
  try {
    const sites = await getBlockedSites();
    const rules = await getActiveRules();
    const lastError = await chrome.storage.local.get({ lastRebuildError: null });
    
    // Статус
    let statusHtml = '';
    if (rules.length === 0 && sites.length > 0) {
      statusHtml = '<div class="status error">Ошибка: Правила не применены, но есть сайты в списке</div>';
    } else if (rules.length !== sites.length && sites.length > 0) {
      statusHtml = `<div class="status warning">Предупреждение: Количество правил (${rules.length}) не совпадает с количеством сайтов (${sites.length})</div>`;
    } else if (rules.length > 0) {
      statusHtml = `<div class="status success">ОК: Применено ${rules.length} правил для ${sites.length} сайтов</div>`;
    } else {
      statusHtml = '<div class="status">Нет заблокированных сайтов</div>';
    }
    statusEl.innerHTML = statusHtml;
    
    // Правила
    if (rules.length === 0) {
      rulesListEl.innerHTML = '<div class="muted">Нет активных правил</div>';
    } else {
      rulesListEl.innerHTML = rules.map(rule => {
        const testUrls = [
          rule.condition.regexFilter.match(/youtube\.com/) ? 'https://youtube.com/' : null,
          rule.condition.regexFilter.match(/facebook\.com/) ? 'https://facebook.com/' : null,
        ].filter(Boolean);
        
        let testResults = '';
        if (testUrls.length > 0) {
          testResults = testUrls.map(url => {
            const matches = new RegExp(rule.condition.regexFilter).test(url);
            return `<div class="test-url ${matches ? 'match' : 'no-match'}">${matches ? '✓' : '✗'} ${url}</div>`;
          }).join('');
        }
        
        return `
          <div class="rule-item">
            <div><strong>Правило ID ${rule.id}</strong></div>
            <div class="muted" style="font-family: var(--mono); font-size: 12px; margin-top: 4px;">${rule.condition.regexFilter}</div>
            ${testResults}
          </div>
        `;
      }).join('');
    }
    
    // Сайты
    if (sites.length === 0) {
      sitesListEl.innerHTML = '<div class="muted">Нет заблокированных сайтов</div>';
    } else {
      sitesListEl.innerHTML = sites.map((site, idx) => {
        const host = typeof site === 'string' ? site : (site.host || site);
        return `<div class="rule-item">${idx + 1}. ${host}</div>`;
      }).join('');
    }
    
    // Последняя ошибка
    if (lastError.lastRebuildError) {
      const error = lastError.lastRebuildError;
      const date = new Date(error.timestamp).toLocaleString();
      lastErrorEl.innerHTML = `
        <div class="status error">
          <div><strong>${date}</strong></div>
          <div>${error.message}</div>
          ${error.stack ? `<div style="font-size: 11px; margin-top: 8px; font-family: var(--mono);">${error.stack}</div>` : ''}
        </div>
      `;
    } else {
      lastErrorEl.innerHTML = '<div class="muted">Ошибок не было</div>';
    }
  } catch (err) {
    statusEl.innerHTML = `<div class="status error">Ошибка при загрузке данных: ${err.message}</div>`;
    console.error('Error updating status:', err);
  }
}

async function testUrl() {
  const urlInput = document.getElementById('testUrl');
  const resultEl = document.getElementById('testResult');
  const url = urlInput.value.trim();
  
  if (!url) {
    resultEl.innerHTML = '<div class="status warning">Введите URL для проверки</div>';
    return;
  }
  
  try {
    new URL(url);
  } catch {
    resultEl.innerHTML = '<div class="status error">Неверный формат URL</div>';
    return;
  }
  
  resultEl.innerHTML = '<div class="muted">Проверка...</div>';
  
  try {
    const sites = await getBlockedSites();
    const rules = await getActiveRules();
    
    const normalizedSites = sites.map(s => typeof s === 'string' ? s : (s.host || s));
    const isBlocked = isBlockedUrl(url, normalizedSites);
    const ruleTests = testUrlAgainstRules(url, rules);
    
    const matchingRules = ruleTests.filter(r => r.matches);
    
    let resultHtml = '';
    if (isBlocked) {
      resultHtml += '<div class="status success">✓ URL заблокирован в списке сайтов</div>';
    } else {
      resultHtml += '<div class="status">URL не найден в списке сайтов</div>';
    }
    
    if (matchingRules.length > 0) {
      resultHtml += `<div class="status success" style="margin-top: 8px;">✓ Соответствует ${matchingRules.length} правил(у): ${matchingRules.map(r => r.ruleId).join(', ')}</div>`;
    } else {
      resultHtml += '<div class="status warning" style="margin-top: 8px;">✗ Не соответствует ни одному правилу</div>';
    }
    
    if (isBlocked && matchingRules.length === 0) {
      resultHtml += '<div class="status error" style="margin-top: 8px;">⚠ Проблема: URL в списке, но правила не работают!</div>';
    }
    
    resultEl.innerHTML = resultHtml;
  } catch (err) {
    resultEl.innerHTML = `<div class="status error">Ошибка при проверке: ${err.message}</div>`;
    console.error('Error testing URL:', err);
  }
}

async function rebuildRules() {
  const resultEl = document.getElementById('testResult');
  resultEl.innerHTML = '<div class="muted">Перестройка правил...</div>';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'rebuildRules' });
    if (response && response.success) {
      resultEl.innerHTML = `<div class="status success">Правила успешно перестроены (${response.rulesCount} правил)</div>`;
      await updateStatus();
    } else {
      resultEl.innerHTML = `<div class="status error">Ошибка при перестройке: ${response?.error || 'Unknown error'}</div>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<div class="status error">Ошибка: ${err.message}</div>`;
  }
}

// Обработчики
document.getElementById('testBtn').addEventListener('click', testUrl);
document.getElementById('testUrl').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') testUrl();
});
document.getElementById('refreshBtn').addEventListener('click', updateStatus);
document.getElementById('rebuildBtn').addEventListener('click', rebuildRules);

// Инициализация
updateStatus();

