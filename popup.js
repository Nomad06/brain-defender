// STORAGE_KEY загружается из consts.js

// Вспомогательная функция для нормализации доменов из URL (использует utils.js если доступен)
function normalizeHostFromUrl(urlStr) {
  if (window.utils && window.utils.normalizeHost) {
    return window.utils.normalizeHost(urlStr);
  }
  // Fallback для случая, если utils.js не загружен
  try {
    // Если это простой домен без протокола, добавляем протокол для парсинга
    let urlToParse = urlStr.trim();
    if (!urlToParse.includes('://')) {
      urlToParse = 'https://' + urlToParse;
    }
    const u = new URL(urlToParse);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return (u.hostname || "").toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function getSites() {
  const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
  const arr = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  return arr;
}

async function setSites(sites) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: sites });
}

function uniqueSorted(hosts) {
  return [...new Set(hosts.filter(Boolean).map(h => String(h).toLowerCase().replace(/^www\./, "")))].sort();
}

const openOptionsEl = document.getElementById("openOptions");
const addCurrentEl = document.getElementById("addCurrent");
const countEl = document.getElementById("count");

async function refreshCount() {
  try {
    const sites = await getSites();
    const count = sites.length;
    if (countEl) {
      countEl.textContent = String(count);
    }
  } catch (err) {
    console.error("Ошибка при обновлении счётчика:", err);
    if (countEl) {
      countEl.textContent = "?";
    }
  }
}

// Проверка, заблокирован ли сайт
async function checkIfSiteIsBlocked(host) {
  try {
    const sites = await getSites();
    const normalizeFn = window.utils && window.utils.normalizeHost 
      ? window.utils.normalizeHost 
      : (h) => h.toLowerCase().replace(/^www\./, "");
    
    const normalizedHost = normalizeFn(host);
    return sites.some(s => {
      const sHost = typeof s === 'string' ? s : s.host;
      const normalized = normalizeFn(sHost);
      return normalized === normalizedHost;
    });
  } catch (err) {
    console.error('Error checking if site is blocked:', err);
    return false;
  }
}

// Инициализация i18n и настройка интерфейса
(async () => {
  // Ждем инициализации i18n
  if (window.i18n && window.i18n.init) {
    await window.i18n.init();
  }
  
  // Применяем переводы к data-i18n элементам
  if (window.i18n && window.i18n.applyLanguage) {
    window.i18n.applyLanguage();
  }
  
  // Обновляем подсказку с параметрами
  const hintEl = document.querySelector('[data-i18n="popup.hint"]');
  if (hintEl && window.i18n) {
    const hintText = window.i18n.t('popup.hint', { example: 'news.example.com' });
    hintEl.innerHTML = hintText.replace('news.example.com', '<span class="kbd">news.example.com</span>');
  }
  
  await refreshCount();
  
  // Обработчики для кнопок временного разрешения текущего сайта
  const allowCurrent15min = document.getElementById('allowCurrent15min');
  const allowCurrent30min = document.getElementById('allowCurrent30min');
  const allowCurrent1hour = document.getElementById('allowCurrent1hour');
  
  if (allowCurrent15min) {
    allowCurrent15min.addEventListener('click', () => allowCurrentSiteTemporarily(15));
  }
  if (allowCurrent30min) {
    allowCurrent30min.addEventListener('click', () => allowCurrentSiteTemporarily(30));
  }
  if (allowCurrent1hour) {
    allowCurrent1hour.addEventListener('click', () => allowCurrentSiteTemporarily(60));
  }

  // Инициализация фокус-сессий
  if (window.focusSessions && window.focusSessions.initFocusSessions) {
    await window.focusSessions.initFocusSessions();
    await refreshFocusSession();
    
    // Обновляем таймер каждую секунду
    setInterval(refreshFocusSession, 1000);
  }
})();

// Обновление UI фокус-сессии
async function refreshFocusSession() {
  if (!window.focusSessions) return;
  
  try {
    const session = await window.focusSessions.getCurrentSession();
    const focusSessionCard = document.getElementById('focusSessionCard');
    const focusSessionStartCard = document.getElementById('focusSessionStartCard');
    const focusSessionTime = document.getElementById('focusSessionTime');
    const pauseBtn = document.getElementById('pauseFocusSession');
    const stopBtn = document.getElementById('stopFocusSession');
    const startBtn = document.getElementById('startFocusSession');
    
    if (session && session.state !== 'idle' && session.state !== 'completed') {
      if (focusSessionCard) focusSessionCard.style.display = 'block';
      if (focusSessionStartCard) focusSessionStartCard.style.display = 'none';
      
      const remaining = await window.focusSessions.getRemainingTime();
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (focusSessionTime) {
        focusSessionTime.textContent = timeStr;
      }
      
      if (pauseBtn) {
        pauseBtn.textContent = session.state === 'paused' ? 'Продолжить' : 'Пауза';
        pauseBtn.onclick = session.state === 'paused' 
          ? () => window.focusSessions.resumeFocusSession().then(() => refreshFocusSession())
          : () => window.focusSessions.pauseFocusSession().then(() => refreshFocusSession());
      }
      
      if (stopBtn) {
        stopBtn.onclick = () => window.focusSessions.stopFocusSession().then(() => refreshFocusSession());
      }
    } else {
      if (focusSessionCard) focusSessionCard.style.display = 'none';
      if (focusSessionStartCard) focusSessionStartCard.style.display = 'block';
      
      if (startBtn) {
        // Удаляем старые обработчики перед добавлением нового
        startBtn.replaceWith(startBtn.cloneNode(true));
        const newStartBtn = document.getElementById('startFocusSession');
        if (newStartBtn) {
          newStartBtn.onclick = async () => {
            // Показываем модальное окно для выбора сайтов
            await openPomodoroSitesModal();
          };
        }
      }
    }
  } catch (err) {
    console.error('Error refreshing focus session:', err);
  }
}

// Модальное окно для выбора сайтов Pomodoro
let pomodoroSelectedSites = new Set(); // Дополнительные сайты для Pomodoro
let pomodoroMainSitesSelected = new Set(); // Выбранные сайты из основного списка

async function openPomodoroSitesModal() {
  const modal = document.getElementById('pomodoroSitesModalBack');
  const modalContent = document.getElementById('pomodoroSitesModal');
  const sitesList = document.getElementById('pomodoroSitesList');
  const additionalSitesList = document.getElementById('pomodoroAdditionalSitesList');
  const loadingEl = document.getElementById('pomodoroSitesLoading');
  const contentEl = document.getElementById('pomodoroSitesContent');
  
  if (!modal || !sitesList || !loadingEl || !contentEl) return;
  
  // Очищаем состояние
  pomodoroSelectedSites.clear();
  pomodoroMainSitesSelected.clear();
  
  // Сбрасываем стили перед показом
  modal.style.display = 'flex';
  modal.style.opacity = '0';
  if (modalContent) {
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
  }
  loadingEl.style.display = 'block';
  contentEl.style.display = 'none';
  
  // Плавное появление после небольшой задержки для рендеринга
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      if (modalContent) {
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
      }
    });
  });
  
  try {
    // Получаем список всех сайтов
    const sites = await getSites();
    
    // Заполняем список сайтов из основного списка
    sitesList.innerHTML = '';
    if (sites.length === 0) {
      sitesList.innerHTML = '<div class="muted" style="padding: 12px; text-align: center; font-size: 12px;">Нет сайтов в списке блокировки</div>';
    } else {
      sites.forEach(site => {
        const host = typeof site === 'string' ? site : site.host;
        const siteId = `pomodoro_site_${host}`;
        
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; border-radius: 4px; transition: background 0.15s;';
        label.onmouseover = () => label.style.background = 'var(--card)';
        label.onmouseout = () => label.style.background = 'transparent';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = siteId;
        checkbox.dataset.host = host;
        checkbox.checked = false; // По умолчанию не выбраны
        checkbox.style.cssText = 'cursor: pointer;';
        
        const span = document.createElement('span');
        span.textContent = host;
        span.style.cssText = 'flex: 1; font-size: 12px; user-select: none;';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        sitesList.appendChild(label);
        
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            pomodoroMainSitesSelected.add(host);
          } else {
            pomodoroMainSitesSelected.delete(host);
          }
        });
      });
    }
    
    // Очищаем список дополнительных сайтов
    if (additionalSitesList) {
      additionalSitesList.innerHTML = '';
    }
    
    // Скрываем индикатор загрузки и показываем контент с плавным переходом
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';
    contentEl.style.opacity = '0';
    requestAnimationFrame(() => {
      contentEl.style.transition = 'opacity 0.2s ease-in-out';
      contentEl.style.opacity = '1';
    });
    
  } catch (err) {
    console.error('Error loading sites for Pomodoro:', err);
    loadingEl.innerHTML = '<div class="muted" style="padding: 12px; text-align: center; font-size: 12px; color: var(--danger);">Ошибка загрузки списка сайтов</div>';
  }
}

function closePomodoroSitesModal() {
  const modal = document.getElementById('pomodoroSitesModalBack');
  const modalContent = document.getElementById('pomodoroSitesModal');
  const loadingEl = document.getElementById('pomodoroSitesLoading');
  const contentEl = document.getElementById('pomodoroSitesContent');
  
  if (!modal) return;
  
  // Плавное скрытие
  modal.style.opacity = '0';
  if (modalContent) {
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
  }
  
  setTimeout(() => {
    modal.style.display = 'none';
    if (loadingEl) {
      loadingEl.style.display = 'none';
      loadingEl.innerHTML = '<div class="muted">Загрузка...</div>'; // Восстанавливаем текст
    }
    if (contentEl) contentEl.style.display = 'none';
    // Сбрасываем стили для следующего открытия
    modal.style.opacity = '0';
    if (modalContent) {
      modalContent.style.opacity = '0';
      modalContent.style.transform = 'scale(0.95)';
    }
  }, 200);
  
  pomodoroSelectedSites.clear();
  pomodoroMainSitesSelected.clear();
}

// Инициализация обработчиков модального окна Pomodoro
(function initPomodoroSitesModal() {
  const modal = document.getElementById('pomodoroSitesModalBack');
  const closeBtn = document.getElementById('closePomodoroSitesModal');
  const cancelBtn = document.getElementById('cancelPomodoroSites');
  const confirmBtn = document.getElementById('confirmPomodoroSites');
  const addSiteBtn = document.getElementById('addPomodoroSite');
  const additionalSiteInput = document.getElementById('pomodoroAdditionalSite');
  const additionalSitesList = document.getElementById('pomodoroAdditionalSitesList');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closePomodoroSitesModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePomodoroSitesModal);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePomodoroSitesModal();
      }
    });
  }
  
  // Добавление дополнительного сайта
  function addAdditionalSite() {
    if (!additionalSiteInput || !additionalSitesList) return;
    
    const host = normalizeHostFromUrl(additionalSiteInput.value);
    if (!host) {
      alert('Неверный формат домена');
      return;
    }
    
    if (pomodoroSelectedSites.has(host)) {
      alert('Этот сайт уже добавлен');
      return;
    }
    
    pomodoroSelectedSites.add(host);
    additionalSiteInput.value = '';
    
    // Добавляем в список
    const siteItem = document.createElement('div');
    siteItem.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--card2); border-radius: 4px; font-size: 11px; animation: fadeIn 0.2s;';
    
    const span = document.createElement('span');
    span.textContent = host;
    span.style.cssText = 'user-select: none;';
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.className = 'btn';
    removeBtn.style.cssText = 'padding: 2px 6px; font-size: 10px; margin-left: 4px; min-width: auto; line-height: 1;';
    removeBtn.title = 'Удалить';
    removeBtn.onclick = () => {
      pomodoroSelectedSites.delete(host);
      siteItem.style.animation = 'fadeOut 0.2s';
      setTimeout(() => siteItem.remove(), 200);
    };
    
    siteItem.appendChild(span);
    siteItem.appendChild(removeBtn);
    additionalSitesList.appendChild(siteItem);
    
    // Фокус на поле ввода
    if (additionalSiteInput) {
      additionalSiteInput.focus();
    }
  }
  
  if (addSiteBtn) {
    addSiteBtn.addEventListener('click', addAdditionalSite);
  }
  
  if (additionalSiteInput) {
    additionalSiteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addAdditionalSite();
      }
    });
  }
  
  // Подтверждение и старт сессии
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      // Объединяем выбранные сайты из основного списка и дополнительные
      const sitesToBlock = [
        ...Array.from(pomodoroMainSitesSelected),
        ...Array.from(pomodoroSelectedSites)
      ];
      
      closePomodoroSitesModal();
      
      // Запускаем сессию с выбранными сайтами
      await window.focusSessions.startFocusSession(25, sitesToBlock);
      await refreshFocusSession();
    });
  }
})();

if (openOptionsEl) {
  openOptionsEl.addEventListener("click", () => {
    try {
      chrome.runtime.openOptionsPage();
    } catch (err) {
      console.error("Ошибка при открытии настроек:", err);
    }
  });
}

if (addCurrentEl) {
  addCurrentEl.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        console.error("Не удалось получить URL текущей вкладки");
        return;
      }

      const host = normalizeHostFromUrl(tab.url);
      if (!host) {
        console.error("Не удалось определить домен из URL:", tab.url);
        return;
      }

      const sites = await getSites();
      const hostExists = sites.some(s => {
        const sHost = typeof s === 'string' ? s : s.host;
        return sHost === host;
      });
      
      if (!hostExists) {
        sites.push({
          host: host,
          addedAt: Date.now(),
          category: null,
          schedule: null
        });
        await setSites(sites);
        await refreshCount();
      }
    } catch (err) {
      console.error("Ошибка при добавлении сайта:", err);
      // Показываем пользователю понятное сообщение об ошибке
      if (err.message) {
        console.error("Детали ошибки:", err.message);
      }
    }
  });
}