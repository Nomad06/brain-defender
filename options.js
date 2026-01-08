// STORAGE_KEY загружается из consts.js
// Fallback на случай, если consts.js не загрузился
if (typeof STORAGE_KEY === 'undefined') {
  var STORAGE_KEY = "blockedSites";
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
    let host = (u.hostname || "").toLowerCase();
    host = host.replace(/^www\./, "");
    if (!host || host.includes(" ")) return null;
    return host;
  } catch {
    return null;
  }
}

const challengeCanvas = document.getElementById("challengeCanvas");
const ctx = challengeCanvas.getContext("2d");

function drawCodeOnCanvas(codeStr) {
  ctx.clearRect(0, 0, challengeCanvas.width, challengeCanvas.height);

  // фон
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, 0, challengeCanvas.width, challengeCanvas.height);

  // “шум”/линии, чтобы ещё сложнее было OCR
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * challengeCanvas.width, Math.random() * challengeCanvas.height);
    ctx.lineTo(Math.random() * challengeCanvas.width, Math.random() * challengeCanvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // текст
  ctx.font = "700 18px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.textBaseline = "middle";
  ctx.fillText(codeStr, 14, challengeCanvas.height / 2);

  // лёгкое смещение/подчёркивание
  ctx.beginPath();
  ctx.moveTo(12, 32);
  ctx.lineTo(challengeCanvas.width - 12, 32);
  ctx.strokeStyle = "rgba(124,242,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
}


function uniqueSorted(hosts) {
  return [...new Set(hosts.filter(Boolean).map(h => String(h).toLowerCase().replace(/^www\./, "")))].sort();
}

async function getSites() {
  try {
    console.log('[getSites] STORAGE_KEY:', STORAGE_KEY);
    const data = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
    console.log('[getSites] Raw data from storage:', data);
    const arr = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    console.log('[getSites] Array length:', arr.length);
    
    // Проверяем формат данных
    if (arr.length > 0 && typeof arr[0] === 'string') {
      // Старый формат - возвращаем как есть для обратной совместимости
      const result = uniqueSorted(arr.map(normalizeHost).filter(Boolean));
      console.log('[getSites] Old format, returning:', result.length, 'sites');
      return result;
    }
    
    // Новый формат - возвращаем массив объектов
    const result = arr.map(item => {
      if (typeof item === 'string') {
        return {
          host: normalizeHost(item),
          addedAt: Date.now(),
          category: null,
          schedule: null,
          conditionalRules: null
        };
      }
      // Сохраняем все поля объекта, включая conditionalRules
      return {
        host: normalizeHost(item.host || item),
        addedAt: item.addedAt || Date.now(),
        category: item.category || null,
        schedule: item.schedule || null,
        conditionalRules: item.conditionalRules !== undefined ? item.conditionalRules : null
      };
    }).filter(item => item.host);
    console.log('[getSites] New format, returning:', result.length, 'sites');
    return result;
  } catch (err) {
    console.error('[getSites] Error:', err);
    return [];
  }
}

async function setSites(sites) {
  // Если sites - массив строк, преобразуем в новый формат
  const normalized = sites.map(site => {
    if (typeof site === 'string') {
      return {
        host: normalizeHost(site),
        addedAt: Date.now(),
        category: null,
        schedule: null,
        conditionalRules: null
      };
    }
    return {
      host: normalizeHost(site.host || site),
      addedAt: site.addedAt || Date.now(),
      category: site.category || null,
      schedule: site.schedule || null,
      conditionalRules: site.conditionalRules !== undefined ? site.conditionalRules : null
    };
  }).filter(item => item.host);
  
  // Сортируем по хосту
  normalized.sort((a, b) => a.host.localeCompare(b.host));
  
  await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
}

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") {
      // Преобразуем onClick -> click, onMouseDown -> mousedown и т.д.
      const eventName = k.slice(2).toLowerCase();
      n.addEventListener(eventName, v);
    }
    else n.setAttribute(k, String(v));
  }
  for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

function randomCode() {
  const parts = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < 14; i++) parts.push(chars[Math.floor(Math.random() * chars.length)]);
  return parts.join("");
}

function makeMathProblem() {
  // Небанальные, но не ад
  const a = 10 + Math.floor(Math.random() * 90);
  const b = 10 + Math.floor(Math.random() * 90);
  const c = 2 + Math.floor(Math.random() * 8);

  const type = Math.floor(Math.random() * 3);
  if (type === 0) {
    // (a + b) * c
    return { q: `(${a} + ${b}) × ${c} = ?`, ans: (a + b) * c };
  } else if (type === 1) {
    // a*b - c*a
    return { q: `${a}×${b} − ${c}×${a} = ?`, ans: a * b - c * a };
  } else {
    // (a + b) - (c*something)
    const d = 2 + Math.floor(Math.random() * 9);
    return { q: `(${a} + ${b}) − (${c} × ${d}) = ?`, ans: (a + b) - (c * d) };
  }
}

// ---------- UI ----------
const listNode = document.getElementById("list");
const countNode = document.getElementById("count");
const input = document.getElementById("manualInput");
const languageSelect = document.getElementById("languageSelect");
const categoryFilter = document.getElementById("categoryFilter");
let currentCategoryFilter = 'all';

// Обработчик переключения языка
if (languageSelect) {
  languageSelect.addEventListener("change", async (e) => {
    const newLang = e.target.value;
    if (window.i18n && window.i18n.setLanguage) {
      await window.i18n.setLanguage(newLang);
    }
  });
}

const addManualBtn = document.getElementById("addManual");
if (addManualBtn) {
  addManualBtn.addEventListener("click", async () => {
    try {
      const host = normalizeHost(input?.value);
      if (!host) {
        if (input) {
          input.value = "";
          if (window.i18n) {
            input.placeholder = window.i18n.t('options.invalidDomain');
          } else {
            input.placeholder = "не похоже на домен 😅 попробуй ещё раз";
          }
        }
        return;
      }
      const sites = await getSites();
      const hostExists = sites.some(s => {
        const sHost = typeof s === 'string' ? s : s.host;
        return sHost === host;
      });
      
      if (hostExists) {
        alert('Этот сайт уже в списке');
        if (input) input.value = "";
        return;
      }
      
      // Показываем выбор расписания
      pendingAddSiteHost = host;
      const addSiteScheduleSection = document.getElementById('addSiteScheduleSection');
      if (addSiteScheduleSection) {
        addSiteScheduleSection.style.display = 'block';
        updateAddSiteScheduleOptions();
        // Прокручиваем к секции расписания
        addSiteScheduleSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error("Ошибка при добавлении сайта:", err);
    }
  });
}

// Переменная для хранения хоста, который добавляется с расписанием
let pendingAddSiteHost = null;

// Обновление опций расписания при добавлении сайта
function updateAddSiteScheduleOptions() {
  const addSiteScheduleOptions = document.getElementById('addSiteScheduleOptions');
  const addSiteScheduleMode = document.getElementById('addSiteScheduleMode');
  if (!addSiteScheduleOptions || !addSiteScheduleMode) return;
  
  const mode = addSiteScheduleMode.value;
  let optionsHTML = '';
  
  if (mode === 'workHours') {
    optionsHTML = `
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Рабочие часы:</label>
      <div class="row" style="gap: 8px; align-items: center;">
        <input type="time" id="addSiteWorkHoursStart" class="input" value="09:00" style="flex: 1;">
        <span>—</span>
        <input type="time" id="addSiteWorkHoursEnd" class="input" value="18:00" style="flex: 1;">
      </div>
    `;
  } else if (mode === 'custom') {
    optionsHTML = `
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Дни недели:</label>
      <div class="row" style="gap: 8px; flex-wrap: wrap;">
        ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => {
          return `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" data-add-day="${idx}">
            <span>${day}</span>
          </label>`;
        }).join('')}
      </div>
      <div style="margin-top: 12px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Время:</label>
        <div class="row" style="gap: 8px; align-items: center;">
          <input type="time" id="addSiteCustomTimeStart" class="input" value="09:00" style="flex: 1;">
          <span>—</span>
          <input type="time" id="addSiteCustomTimeEnd" class="input" value="18:00" style="flex: 1;">
        </div>
      </div>
    `;
  }
  
  addSiteScheduleOptions.innerHTML = optionsHTML;
  addSiteScheduleOptions.style.display = optionsHTML ? 'block' : 'none';
}

// Инициализация обработчиков для добавления сайта с расписанием
(function initAddSiteScheduleHandlers() {
  const addSiteScheduleMode = document.getElementById('addSiteScheduleMode');
  const cancelAddSiteSchedule = document.getElementById('cancelAddSiteSchedule');
  const confirmAddSiteWithSchedule = document.getElementById('confirmAddSiteWithSchedule');
  
  if (addSiteScheduleMode) {
    addSiteScheduleMode.addEventListener('change', updateAddSiteScheduleOptions);
  }
  
  if (cancelAddSiteSchedule) {
    cancelAddSiteSchedule.addEventListener('click', () => {
      pendingAddSiteHost = null;
      const addSiteScheduleSection = document.getElementById('addSiteScheduleSection');
      if (addSiteScheduleSection) addSiteScheduleSection.style.display = 'none';
      const input = document.getElementById('manualInput');
      if (input) input.value = "";
    });
  }
  
  if (confirmAddSiteWithSchedule) {
    confirmAddSiteWithSchedule.addEventListener('click', async () => {
      if (!pendingAddSiteHost || !window.schedule) {
        return;
      }
      
      try {
        const addSiteScheduleMode = document.getElementById('addSiteScheduleMode');
        const mode = addSiteScheduleMode ? addSiteScheduleMode.value : 'always';
        const schedule = window.schedule.createDefaultSchedule();
        schedule.mode = mode;
        
        if (mode === 'workHours') {
          const startInput = document.getElementById('addSiteWorkHoursStart');
          const endInput = document.getElementById('addSiteWorkHoursEnd');
          schedule.workHours = {
            start: startInput ? startInput.value : '09:00',
            end: endInput ? endInput.value : '18:00'
          };
        }
        
        if (mode === 'custom') {
          const selectedDays = [];
          document.querySelectorAll('[data-add-day]:checked').forEach(cb => {
            selectedDays.push(parseInt(cb.dataset.addDay));
          });
          schedule.customDays = selectedDays;
          
          const startInput = document.getElementById('addSiteCustomTimeStart');
          const endInput = document.getElementById('addSiteCustomTimeEnd');
          schedule.customTime = {
            start: startInput ? startInput.value : '09:00',
            end: endInput ? endInput.value : '18:00'
          };
        }
        
        // Валидация
        const validation = window.schedule.validateSchedule(schedule);
        if (!validation.valid) {
          alert('Ошибка валидации расписания: ' + validation.error);
          return;
        }
        
        const sites = await getSites();
        sites.push({
          host: pendingAddSiteHost,
          addedAt: Date.now(),
          category: null,
          schedule: schedule,
          conditionalRules: null
        });
        
        await setSites(sites);
        
        // Отправляем сообщение service worker для перестройки правил
        try {
          await chrome.runtime.sendMessage({ action: 'rebuildRules' });
        } catch (err) {
          console.error('Error sending rebuild message:', err);
        }
        
        pendingAddSiteHost = null;
        const addSiteScheduleSection = document.getElementById('addSiteScheduleSection');
        if (addSiteScheduleSection) addSiteScheduleSection.style.display = 'none';
        const input = document.getElementById('manualInput');
        if (input) input.value = "";
        await render();
      } catch (err) {
        console.error("Ошибка при добавлении сайта с расписанием:", err);
        alert('Ошибка: ' + err.message);
      }
    });
  }
})();

const addCurrentBtn = document.getElementById("addCurrent");
if (addCurrentBtn) {
  addCurrentBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        alert('Не удалось получить URL текущей вкладки');
        return;
      }
      
      const host = normalizeHost(tab.url);
      if (!host) {
        alert('Не удалось определить домен из URL');
        return;
      }

      const sites = await getSites();
      const hostExists = sites.some(s => {
        const sHost = typeof s === 'string' ? s : s.host;
        return sHost === host;
      });
      
      if (hostExists) {
        alert('Этот сайт уже в списке блокировки');
        return;
      }
      
      // Показываем выбор расписания
      pendingAddSiteHost = host;
      const addSiteScheduleSection = document.getElementById('addSiteScheduleSection');
      if (addSiteScheduleSection) {
        addSiteScheduleSection.style.display = 'block';
        updateAddSiteScheduleOptions();
        // Прокручиваем к секции расписания
        addSiteScheduleSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error("Ошибка при добавлении текущего сайта:", err);
      alert('Ошибка при добавлении сайта: ' + (err.message || 'Неизвестная ошибка'));
    }
  });
}

// ---------- “Сложное удаление” ----------
const modalBack = document.getElementById("modalBack");
const closeModalBtn = document.getElementById("closeModal");
const targetHostNode = document.getElementById("targetHost");
const challengeCodeNode = document.getElementById("challengeCode");
const codeInput = document.getElementById("codeInput");
const regenCodeBtn = document.getElementById("regenCode");
const step1hint = document.getElementById("step1hint");

const mathBox = document.getElementById("mathBox");
const checkMathBtn = document.getElementById("checkMath");
const mathHint = document.getElementById("mathHint");

const holdBtn = document.getElementById("holdBtn");
const holdBar = document.getElementById("holdBar");
const holdHint = document.getElementById("holdHint");

const confirmDeleteBtn = document.getElementById("confirmDelete");

let deleteTarget = null;
let devMode = false;
const devModeCheckbox = document.getElementById("devMode");

let step1ok = false;
let step2ok = false;
let step3ok = false;

let code = "";
let problems = [];
let holdTimer = null;
let holdStart = 0;
const HOLD_MS = 10_000;

// Обработчики для очистки
const holdHandlers = {
  mouseup: null,
  touchend: null,
  touchcancel: null
};

async function deleteSiteDirectly(host) {
  if (!confirm(`Удалить ${host} из списка?`)) {
    return;
  }
  
  try {
    const sites = await getSites();
    const targetNormalized = String(host).toLowerCase().replace(/^www\./, "");
    const next = sites.filter(s => {
      const sHost = typeof s === 'string' ? s : s.host;
      const normalized = String(sHost).toLowerCase().replace(/^www\./, "");
      return normalized !== targetNormalized;
    });
    
    await setSites(next);
    await render();
  } catch (err) {
    console.error("Ошибка при удалении сайта:", err);
    alert('Ошибка при удалении сайта');
  }
}

// Сохраняем ссылку на элемент, который имел фокус до открытия модалки
let previousActiveElement = null;

function openDeleteModal(host) {
  console.log("=== openDeleteModal вызвана ===");
  console.log("host:", host);
  
  if (!host) {
    console.error("openDeleteModal вызвана без host");
    return;
  }
  
  // Если режим разработки включен, удаляем напрямую
  if (devMode) {
    deleteSiteDirectly(host);
    return;
  }
  
  console.log("Открываем модальное окно для удаления:", host);
  
  deleteTarget = host;
  
  if (!targetHostNode) {
    console.error("targetHostNode не найден!");
    return;
  }
  targetHostNode.textContent = host;
  console.log("targetHostNode обновлен");

  if (!modalBack) {
    console.error("modalBack не найден!");
    return;
  }

  step1ok = false;
  step2ok = false;
  step3ok = false;

  regenCode();
  setupMath();
  resetHold();

  if (confirmDeleteBtn) {
    confirmDeleteBtn.disabled = true;
    console.log("confirmDeleteBtn отключен");
  } else {
    console.error("confirmDeleteBtn не найден!");
  }
  
  // Сохраняем текущий активный элемент
  previousActiveElement = document.activeElement;
  
  modalBack.classList.add("show");
  
  // Устанавливаем фокус на первый интерактивный элемент модалки
  setTimeout(() => {
    const firstInput = codeInput || regenCodeBtn || closeModalBtn;
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
  
  console.log("Модальное окно открыто. Класс show добавлен:", modalBack.classList.contains("show"));
  console.log("Стили modalBack:", window.getComputedStyle(modalBack).display);
}

function closeDeleteModal() {
  modalBack.classList.remove("show");
  deleteTarget = null;
  
  // Очистка таймера
  if (holdTimer) {
    clearInterval(holdTimer);
    holdTimer = null;
  }
  
  // Удаление глобальных обработчиков
  if (holdHandlers.mouseup) {
    window.removeEventListener("mouseup", holdHandlers.mouseup);
    holdHandlers.mouseup = null;
  }
  if (holdHandlers.touchend) {
    window.removeEventListener("touchend", holdHandlers.touchend);
    holdHandlers.touchend = null;
  }
  if (holdHandlers.touchcancel) {
    window.removeEventListener("touchcancel", holdHandlers.touchcancel);
    holdHandlers.touchcancel = null;
  }
  
  // Сброс состояния
  resetHold();
  
  // Возвращаем фокус на предыдущий элемент
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
  previousActiveElement = null;
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeDeleteModal);
}

if (modalBack) {
  modalBack.addEventListener("click", (e) => {
    if (e.target === modalBack) closeDeleteModal();
  });
  
  // Обработка клавиши Escape для закрытия модалки
  modalBack.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBack.classList.contains("show")) {
      e.preventDefault();
      e.stopPropagation();
      closeDeleteModal();
    }
  });
  
  // Ограничение фокуса внутри модалки (trap focus)
  modalBack.addEventListener("keydown", (e) => {
    if (!modalBack.classList.contains("show")) return;
    
    if (e.key === "Tab") {
      const focusableElements = modalBack.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

function regenCode() {
    code = randomCode();
    drawCodeOnCanvas(code);
  if (challengeCodeNode) challengeCodeNode.textContent = code;
  if (codeInput) codeInput.value = "";
  step1ok = false;
  if (step1hint && window.i18n) step1hint.textContent = window.i18n.t('options.step1Hint');
  updateConfirmState();
}
if (regenCodeBtn) {
  regenCodeBtn.addEventListener("click", regenCode);
}

if (codeInput) {
  codeInput.addEventListener("input", () => {
    const v = codeInput.value.trim().toUpperCase();
    if (v === code) {
      step1ok = true;
      if (step1hint && window.i18n) step1hint.textContent = window.i18n.t('options.step1Ok');
    } else {
      step1ok = false;
      if (step1hint && window.i18n) step1hint.textContent = window.i18n.t('options.step1Almost');
    }
    updateConfirmState();
  });
}

function setupMath() {
  if (!mathBox) return;
  problems = [makeMathProblem(), makeMathProblem(), makeMathProblem()];
  mathBox.innerHTML = "";
  problems.forEach((p, i) => {
    const row = el("div", { class: "row" }, [
      el("div", { class: "kbd", style: "min-width: 230px;" }, [p.q]),
      el("input", { class: "input", id: `m_${i}`, placeholder: window.i18n?.t('options.answerPlaceholder') || "ответ", style: "font-family: var(--mono);" }, [])
    ]);
    mathBox.appendChild(row);
  });
  step2ok = false;
  if (mathHint && window.i18n) mathHint.textContent = window.i18n.t('options.step2Solve');
  updateConfirmState();
}

if (checkMathBtn) {
  checkMathBtn.addEventListener("click", () => {
    // Проверяем только если шаг1 пройден
    if (!step1ok) {
      if (mathHint && window.i18n) mathHint.textContent = window.i18n.t('options.step2First');
      return;
    }

    let ok = true;
    problems.forEach((p, i) => {
      const inputEl = document.getElementById(`m_${i}`);
      if (!inputEl) {
        ok = false;
        return;
      }
      const v = inputEl.value.trim();
      const num = Number(v);
      if (!Number.isFinite(num) || num !== p.ans) ok = false;
    });

    if (ok) {
      step2ok = true;
      if (mathHint && window.i18n) mathHint.textContent = window.i18n.t('options.step2Correct');
    } else {
      // "жёстко": сбрасываем часть прогресса
      step2ok = false;
      step1ok = false;
      regenCode();
      setupMath();
      if (mathHint && window.i18n) mathHint.textContent = window.i18n.t('options.step2Error');
    }
    updateConfirmState();
  });
}

function resetHold() {
  step3ok = false;
  if (holdBar) {
    holdBar.style.width = "0%";
    // Обновляем aria-valuenow для progressbar
    const progressWrap = holdBar.parentElement;
    if (progressWrap) {
      progressWrap.setAttribute('aria-valuenow', '0');
    }
  }
  if (holdHint && window.i18n) holdHint.textContent = window.i18n.t('options.holdHint');
  updateConfirmState();
}

function startHold() {
  if (!step1ok || !step2ok) {
    if (holdHint && window.i18n) holdHint.textContent = window.i18n.t('options.holdFirst');
    return;
  }
  if (holdTimer) clearInterval(holdTimer);
  holdStart = Date.now();

  holdTimer = setInterval(() => {
    if (!holdBar) {
      if (holdTimer) clearInterval(holdTimer);
      holdTimer = null;
      return;
    }
    
    const elapsed = Date.now() - holdStart;
    const pct = Math.max(0, Math.min(1, elapsed / HOLD_MS));
    const pctValue = Math.round(pct * 100);
    holdBar.style.width = `${pctValue}%`;
    
    // Обновляем aria-valuenow для progressbar
    const progressWrap = holdBar.parentElement;
    if (progressWrap) {
      progressWrap.setAttribute('aria-valuenow', String(pctValue));
    }

    if (elapsed >= HOLD_MS) {
      clearInterval(holdTimer);
      holdTimer = null;
      step3ok = true;
      if (holdHint) {
        if (holdHint && window.i18n) holdHint.textContent = window.i18n.t('options.holdOk');
      }
      updateConfirmState();
    }
  }, 60);
}

function stopHold() {
  if (!holdTimer) return;
  clearInterval(holdTimer);
  holdTimer = null;
  // сброс
  if (holdBar) holdBar.style.width = "0%";
  step3ok = false;
  if (holdHint && window.i18n) holdHint.textContent = window.i18n.t('options.holdReset');
  updateConfirmState();
}

if (holdBtn) {
  holdBtn.addEventListener("mousedown", startHold);
  holdBtn.addEventListener("touchstart", (e) => { 
    e.preventDefault(); 
    startHold(); 
  }, { passive: false });
  
  // Сохраняем ссылки на обработчики для последующего удаления
  holdHandlers.mouseup = stopHold;
  holdHandlers.touchend = stopHold;
  holdHandlers.touchcancel = stopHold;
  
  window.addEventListener("mouseup", holdHandlers.mouseup);
  window.addEventListener("touchend", holdHandlers.touchend);
  window.addEventListener("touchcancel", holdHandlers.touchcancel);
}

function updateConfirmState() {
  if (!confirmDeleteBtn) {
    console.error("confirmDeleteBtn не найден в updateConfirmState");
    return;
  }
  const canDelete = step1ok && step2ok && step3ok && deleteTarget;
  confirmDeleteBtn.disabled = !canDelete;
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!deleteTarget) {
      console.error("deleteTarget пуст");
      return;
    }
    if (!(step1ok && step2ok && step3ok)) {
      console.error("Не все шаги пройдены", { step1ok, step2ok, step3ok });
      return;
    }

    try {
      const sites = await getSites();
      console.log("До удаления:", sites.length, "сайтов");
      
      // Нормализуем оба значения для корректного сравнения
      const targetNormalized = String(deleteTarget).toLowerCase().replace(/^www\./, "");
      const next = sites.filter(s => {
        const sHost = typeof s === 'string' ? s : s.host;
        const normalized = String(sHost).toLowerCase().replace(/^www\./, "");
        const shouldKeep = normalized !== targetNormalized;
        if (!shouldKeep) {
          console.log("Удаляем:", s, "нормализованный:", normalized, "цель:", targetNormalized);
        }
        return shouldKeep;
      });
      
      console.log("После удаления:", next.length, "сайтов");
      
      if (next.length === sites.length) {
        console.warn("ВНИМАНИЕ: Сайт не был удален! Возможно, не совпадает нормализация.");
        console.log("Исходный список:", sites);
        console.log("Удаляемый сайт:", deleteTarget);
        console.log("Нормализованный удаляемый:", targetNormalized);
      }
      
      await setSites(next);
      
      // Проверяем, что данные сохранились
      const verify = await getSites();
      console.log("Проверка после сохранения:", verify.length, "сайтов");
      
      closeDeleteModal();
      await render();
    } catch (err) {
      console.error("Ошибка при удалении сайта:", err);
    }
  });
}

// Переменные для групповых операций
let selectedSites = new Set();

// Открытие модального окна редактирования расписания
let currentScheduleSite = null;

function openScheduleModal(host, site) {
  // Защита от повторного открытия, если модальное окно уже открыто
  const modal = document.getElementById('scheduleModalBack');
  if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
    return;
  }
  
  currentScheduleSite = { host, site };
  const content = document.getElementById('scheduleModalContent');
  
  if (!modal || !content) {
    console.error('Schedule modal elements not found');
    return;
  }
  
  const schedule = site && typeof site === 'object' ? site.schedule : null;
  const currentSchedule = schedule || (window.schedule ? window.schedule.createDefaultSchedule() : { mode: 'always' });
  
  // Создаем UI для редактирования расписания
  content.innerHTML = `
    <div class="card" style="padding: 16px; background: var(--card2); margin-bottom: 12px;">
      <div class="h2" style="margin-bottom: 12px;">${host}</div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Режим блокировки:</label>
        <select id="scheduleMode" class="input" style="width: 100%;">
          <option value="always" ${currentSchedule.mode === 'always' ? 'selected' : ''}>Всегда</option>
          <option value="workHours" ${currentSchedule.mode === 'workHours' ? 'selected' : ''}>Рабочие часы</option>
          <option value="weekends" ${currentSchedule.mode === 'weekends' ? 'selected' : ''}>Выходные</option>
          <option value="custom" ${currentSchedule.mode === 'custom' ? 'selected' : ''}>Кастомное</option>
          <option value="perDay" ${currentSchedule.mode === 'perDay' ? 'selected' : ''}>По дням недели</option>
          <option value="vacation" ${currentSchedule.mode === 'vacation' ? 'selected' : ''}>Каникулы (отключено)</option>
        </select>
      </div>
      
      <div id="scheduleWorkHours" style="display: ${currentSchedule.mode === 'workHours' ? 'block' : 'none'}; margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Рабочие часы:</label>
        <div class="row" style="gap: 8px; align-items: center;">
          <input type="time" id="workHoursStart" class="input" value="${currentSchedule.workHours?.start || '09:00'}" style="flex: 1;">
          <span>—</span>
          <input type="time" id="workHoursEnd" class="input" value="${currentSchedule.workHours?.end || '18:00'}" style="flex: 1;">
        </div>
      </div>
      
      <div id="scheduleCustom" style="display: ${currentSchedule.mode === 'custom' ? 'block' : 'none'}; margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Дни недели:</label>
        <div class="row" style="gap: 8px; flex-wrap: wrap;">
          ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => {
            const isSelected = currentSchedule.customDays && currentSchedule.customDays.includes(idx);
            return `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <input type="checkbox" data-day="${idx}" ${isSelected ? 'checked' : ''}>
              <span>${day}</span>
            </label>`;
          }).join('')}
        </div>
        <div style="margin-top: 12px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Время:</label>
          <div class="row" style="gap: 8px; align-items: center;">
            <input type="time" id="customTimeStart" class="input" value="${currentSchedule.customTime?.start || '09:00'}" style="flex: 1;">
            <span>—</span>
            <input type="time" id="customTimeEnd" class="input" value="${currentSchedule.customTime?.end || '18:00'}" style="flex: 1;">
          </div>
        </div>
      </div>
      
      <div id="scheduleTemplates" style="margin-top: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Шаблоны:</label>
        <div class="row" style="gap: 8px; flex-wrap: wrap;">
          <button class="btn" id="applyWorkdaysTemplateBtn" style="font-size: 11px;">Рабочие дни</button>
          <button class="btn" id="applyWeekendsTemplateBtn" style="font-size: 11px;">Выходные</button>
          <button class="btn" id="applyPerDayTemplateBtn" style="font-size: 11px;">Рабочая неделя</button>
          <button class="btn" id="applyVacationTemplateBtn" style="font-size: 11px;">Каникулы</button>
        </div>
      </div>
    </div>
  `;
  
  // Обработчик изменения режима
  const modeSelect = document.getElementById('scheduleMode');
  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      const workHoursDiv = document.getElementById('scheduleWorkHours');
      const customDiv = document.getElementById('scheduleCustom');
      
      if (workHoursDiv) workHoursDiv.style.display = mode === 'workHours' ? 'block' : 'none';
      if (customDiv) customDiv.style.display = mode === 'custom' ? 'block' : 'none';
    });
  }
  
  // Обработчики шаблонов
  if (window.schedule && window.schedule.createScheduleTemplate) {
    const templates = {
      workdays: 'workdays',
      weekends: 'weekends',
      perDayWork: 'perDayWork',
      vacation: 'vacation'
    };
    
    Object.entries(templates).forEach(([key, templateName]) => {
      const btn = document.getElementById(`apply${key.charAt(0).toUpperCase() + key.slice(1)}TemplateBtn`);
      if (btn) {
        btn.addEventListener('click', () => {
          const template = window.schedule.createScheduleTemplate(templateName);
          applyScheduleTemplateToModal(template);
        });
      }
    });
  }
  
  modal.style.display = 'flex';
}

function applyScheduleTemplateToModal(template) {
  const modeSelect = document.getElementById('scheduleMode');
  if (modeSelect) {
    modeSelect.value = template.mode;
    modeSelect.dispatchEvent(new Event('change'));
    
    if (template.workHours) {
      const startInput = document.getElementById('workHoursStart');
      const endInput = document.getElementById('workHoursEnd');
      if (startInput) startInput.value = template.workHours.start;
      if (endInput) endInput.value = template.workHours.end;
    }
    
    if (template.customDays) {
      template.customDays.forEach((day, idx) => {
        const checkbox = document.querySelector(`[data-day="${idx}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (template.customTime) {
      const startInput = document.getElementById('customTimeStart');
      const endInput = document.getElementById('customTimeEnd');
      if (startInput) startInput.value = template.customTime.start;
      if (endInput) endInput.value = template.customTime.end;
    }
  }
}

function closeScheduleModal() {
  // Очищаем состояние ПЕРЕД закрытием модального окна
  currentScheduleSite = null;
  const modal = document.getElementById('scheduleModalBack');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function saveSchedule() {
  if (!currentScheduleSite || !window.schedule) {
    return;
  }
  
  try {
    const modeSelect = document.getElementById('scheduleMode');
    const mode = modeSelect ? modeSelect.value : 'always';
    
    const schedule = window.schedule.createDefaultSchedule();
    schedule.mode = mode;
    
    if (mode === 'workHours') {
      const startInput = document.getElementById('workHoursStart');
      const endInput = document.getElementById('workHoursEnd');
      schedule.workHours = {
        start: startInput ? startInput.value : '09:00',
        end: endInput ? endInput.value : '18:00'
      };
    }
    
    if (mode === 'custom') {
      const selectedDays = [];
      document.querySelectorAll('#scheduleCustom input[type="checkbox"]:checked').forEach(cb => {
        selectedDays.push(parseInt(cb.dataset.day));
      });
      schedule.customDays = selectedDays;
      
      const startInput = document.getElementById('customTimeStart');
      const endInput = document.getElementById('customTimeEnd');
      schedule.customTime = {
        start: startInput ? startInput.value : '09:00',
        end: endInput ? endInput.value : '18:00'
      };
    }
    
    // Валидация
    const validation = window.schedule.validateSchedule(schedule);
    if (!validation.valid) {
      alert('Ошибка валидации расписания: ' + validation.error);
      return;
    }
    
    // Сохраняем расписание для сайта
    const sites = await getSites();
    const normalizeFn = window.utils && window.utils.normalizeHost 
      ? window.utils.normalizeHost 
      : (h) => h.toLowerCase().replace(/^www\./, "");
    
    const targetNormalized = normalizeFn(currentScheduleSite.host);
    let found = false;
    
    const updated = sites.map(s => {
      const sHost = typeof s === 'string' ? s : s.host;
      const normalizedHost = normalizeFn(sHost);
      
      if (normalizedHost === targetNormalized) {
        found = true;
        return {
          host: sHost,
          addedAt: typeof s === 'object' ? (s.addedAt || Date.now()) : Date.now(),
          category: typeof s === 'object' ? (s.category || null) : null,
          schedule: schedule,
          conditionalRules: typeof s === 'object' ? (s.conditionalRules || null) : null
        };
      }
      return s;
    });
    
    if (!found) {
      console.error('Site not found for schedule update:', currentScheduleSite.host);
      alert('Ошибка: сайт не найден в списке');
      return;
    }
    
    await setSites(updated);
    
    // Закрываем модальное окно ПЕРЕД render(), чтобы избежать повторного открытия
    closeScheduleModal();
    
    // Отправляем сообщение service worker для перестройки правил
    try {
      await chrome.runtime.sendMessage({ action: 'rebuildRules' });
    } catch (err) {
      console.error('Error sending rebuild message:', err);
    }
    
    await render();
  } catch (err) {
    console.error('Error saving schedule:', err);
    alert('Ошибка при сохранении расписания: ' + err.message);
  }
}

// Инициализация обработчиков модального окна расписания
function initScheduleModal() {
  const closeBtn = document.getElementById('closeScheduleModal');
  const cancelBtn = document.getElementById('cancelScheduleBtn');
  const saveBtn = document.getElementById('saveScheduleBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeScheduleModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeScheduleModal);
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSchedule);
  }
  
  // Закрытие по клику вне модального окна
  const modal = document.getElementById('scheduleModalBack');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeScheduleModal();
      }
    });
  }
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('scheduleModalBack');
      if (modal && modal.style.display !== 'none') {
        closeScheduleModal();
      }
    }
  });
}

// Открытие модального окна условных правил
let currentConditionalRulesSite = null;

function openConditionalRulesModal(host, site) {
  // Защита от повторного открытия, если модальное окно уже открыто
  const modal = document.getElementById('conditionalRulesModalBack');
  if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
    return;
  }
  
  currentConditionalRulesSite = { host, site };
  const content = document.getElementById('conditionalRulesModalContent');
  
  if (!modal || !content || !window.conditionalRules) {
    console.error('Conditional rules modal elements not found');
    return;
  }
  
  const rules = site && typeof site === 'object' && site.conditionalRules 
    ? site.conditionalRules 
    : [];
  
  // Создаем UI для редактирования условных правил
  content.innerHTML = `
    <div class="card" style="padding: 16px; background: var(--card2); margin-bottom: 12px;">
      <div class="h2" style="margin-bottom: 12px;">${host}</div>
      <div class="muted" style="margin-bottom: 16px;">Настройте условия, при которых сайт будет блокироваться</div>
      
      <div id="conditionalRulesList">
        ${rules.length === 0 ? '<div class="muted">Нет правил. Добавьте правило ниже.</div>' : ''}
        ${rules.map((rule, idx) => createConditionalRuleHTML(rule, idx)).join('')}
      </div>
      
      <div class="space"></div>
      
      <div style="border-top: 1px solid var(--border); padding-top: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Добавить правило:</label>
        <select id="newRuleType" class="input" style="width: 100%; margin-bottom: 8px;">
          <option value="">Выберите тип правила...</option>
          <option value="visitsPerDay">Блокировка после N посещений в день</option>
          <option value="timeAfter">Блокировка только после определенного времени</option>
          <option value="daysOfWeek">Блокировка только в определенные дни недели</option>
          <option value="timeLimit">Блокировка при превышении лимита времени</option>
        </select>
        <button class="btn" id="addRuleBtn" style="width: 100%;">Добавить правило</button>
      </div>
    </div>
  `;
  
  // Обработчик добавления нового правила
  const addRuleBtn = document.getElementById('addRuleBtn');
  const newRuleType = document.getElementById('newRuleType');
  
  if (addRuleBtn && newRuleType) {
    // Удаляем старые обработчики перед добавлением нового
    const newAddRuleBtn = addRuleBtn.cloneNode(true);
    addRuleBtn.replaceWith(newAddRuleBtn);
    
    newAddRuleBtn.addEventListener('click', () => {
      const type = newRuleType.value;
      if (!type) return;
      
      const newRule = window.conditionalRules.createDefaultConditionalRule(type);
      if (newRule) {
        const rulesList = document.getElementById('conditionalRulesList');
        if (rulesList) {
          // Убираем сообщение "Нет правил" если оно есть
          const noRulesMsg = rulesList.querySelector('.muted');
          if (noRulesMsg && noRulesMsg.textContent.includes('Нет правил')) {
            noRulesMsg.remove();
          }
          
          const currentRuleCount = rulesList.querySelectorAll('.card').length;
          const ruleHTML = createConditionalRuleHTML(newRule, currentRuleCount);
          rulesList.insertAdjacentHTML('beforeend', ruleHTML);
          newRuleType.value = '';
          
          // Добавляем обработчики для нового правила
          attachConditionalRuleHandlers();
        }
      }
    });
  }
  
  // Добавляем обработчики для существующих правил
  attachConditionalRuleHandlers();
  
  modal.style.display = 'flex';
}

function createConditionalRuleHTML(rule, index) {
  let ruleContent = '';
  
  switch (rule.type) {
    case 'visitsPerDay':
      ruleContent = `
        <label style="display: block; margin-top: 8px;">Максимум посещений в день:</label>
        <input type="number" class="input" data-rule-index="${index}" data-rule-field="maxVisits" value="${rule.maxVisits || 5}" min="1" style="width: 100px;">
      `;
      break;
    case 'timeAfter':
      ruleContent = `
        <label style="display: block; margin-top: 8px;">Блокировать после времени:</label>
        <input type="time" class="input" data-rule-index="${index}" data-rule-field="timeAfter" value="${rule.timeAfter || '22:00'}" style="width: 150px;">
      `;
      break;
    case 'daysOfWeek':
      ruleContent = `
        <label style="display: block; margin-top: 8px;">Дни недели:</label>
        <div class="row" style="gap: 8px; flex-wrap: wrap;">
          ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => {
            const isSelected = rule.days && rule.days.includes(idx);
            return `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <input type="checkbox" data-rule-index="${index}" data-day="${idx}" ${isSelected ? 'checked' : ''}>
              <span>${day}</span>
            </label>`;
          }).join('')}
        </div>
      `;
      break;
    case 'timeLimit':
      ruleContent = `
        <label style="display: block; margin-top: 8px;">Максимум времени в день (минуты):</label>
        <input type="number" class="input" data-rule-index="${index}" data-rule-field="maxTimeMinutes" value="${rule.maxTimeMinutes || 60}" min="1" style="width: 100px;">
      `;
      break;
  }
  
  const ruleNames = {
    visitsPerDay: 'Блокировка после N посещений',
    timeAfter: 'Блокировка после времени',
    daysOfWeek: 'Блокировка по дням недели',
    timeLimit: 'Лимит времени в день'
  };
  
  return `
    <div class="card" style="padding: 12px; background: var(--card); margin-bottom: 12px; border: 1px solid var(--border);">
      <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="font-weight: 500;">${ruleNames[rule.type] || rule.type}</div>
        <div class="row" style="gap: 8px; align-items: center;">
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" data-rule-index="${index}" data-rule-field="enabled" ${rule.enabled ? 'checked' : ''}>
            <span style="font-size: 12px;">Включено</span>
          </label>
          <button class="btn danger" data-rule-index="${index}" data-action="remove" style="font-size: 11px; padding: 4px 8px;">Удалить</button>
        </div>
      </div>
      ${ruleContent}
    </div>
  `;
}

function attachConditionalRuleHandlers() {
  // Обработчики для удаления правил
  const rulesList = document.getElementById('conditionalRulesList');
  if (!rulesList) return;
  
  rulesList.querySelectorAll('[data-action="remove"]').forEach(btn => {
    // Удаляем старые обработчики
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
    
    newBtn.addEventListener('click', () => {
      const ruleCard = newBtn.closest('.card');
      if (ruleCard) {
        ruleCard.remove();
        
        // Если правил не осталось, показываем сообщение
        if (rulesList.querySelectorAll('.card').length === 0) {
          rulesList.innerHTML = '<div class="muted">Нет правил. Добавьте правило ниже.</div>';
        }
      }
    });
  });
}

function closeConditionalRulesModal() {
  // Очищаем состояние ПЕРЕД закрытием модального окна
  currentConditionalRulesSite = null;
  const modal = document.getElementById('conditionalRulesModalBack');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function saveConditionalRules() {
  if (!currentConditionalRulesSite || !window.conditionalRules) {
    return;
  }
  
  try {
    const rulesList = document.getElementById('conditionalRulesList');
    if (!rulesList) return;
    
    const rules = [];
    const ruleCards = rulesList.querySelectorAll('.card');
    
    ruleCards.forEach(card => {
      const enabledCheckbox = card.querySelector('[data-rule-field="enabled"]');
      if (!enabledCheckbox) return;
      
      const index = parseInt(enabledCheckbox.dataset.ruleIndex);
      const enabled = enabledCheckbox.checked;
      
      // Определяем тип правила по полям
      let ruleType = null;
      let ruleData = { enabled };
      
      if (card.querySelector('[data-rule-field="maxVisits"]')) {
        ruleType = 'visitsPerDay';
        const maxVisitsInput = card.querySelector('[data-rule-field="maxVisits"]');
        ruleData.maxVisits = parseInt(maxVisitsInput.value) || 5;
      } else if (card.querySelector('[data-rule-field="timeAfter"]')) {
        ruleType = 'timeAfter';
        const timeAfterInput = card.querySelector('[data-rule-field="timeAfter"]');
        ruleData.timeAfter = timeAfterInput.value || '22:00';
      } else if (card.querySelector('[data-day]')) {
        ruleType = 'daysOfWeek';
        const selectedDays = [];
        card.querySelectorAll('[data-day]:checked').forEach(cb => {
          selectedDays.push(parseInt(cb.dataset.day));
        });
        ruleData.days = selectedDays;
      } else if (card.querySelector('[data-rule-field="maxTimeMinutes"]')) {
        ruleType = 'timeLimit';
        const maxTimeInput = card.querySelector('[data-rule-field="maxTimeMinutes"]');
        ruleData.maxTimeMinutes = parseInt(maxTimeInput.value) || 60;
      }
      
      if (ruleType) {
        ruleData.type = ruleType;
        const validation = window.conditionalRules.validateConditionalRule(ruleData);
        if (validation.valid) {
          rules.push(ruleData);
        } else {
          console.warn('Invalid rule:', validation.error);
        }
      }
    });
    
    // Сохраняем правила для сайта
    const sites = await getSites();
    
    const updated = sites.map(s => {
      const sHost = typeof s === 'string' ? s : s.host;
      const normalizeFn = window.utils && window.utils.normalizeHost 
        ? window.utils.normalizeHost 
        : (h) => h.toLowerCase().replace(/^www\./, "");
      
      const normalizedHost = normalizeFn(sHost);
      const targetNormalized = normalizeFn(currentConditionalRulesSite.host);
      
      if (normalizedHost === targetNormalized) {
        return {
          host: sHost,
          addedAt: typeof s === 'object' ? (s.addedAt || Date.now()) : Date.now(),
          category: typeof s === 'object' ? (s.category || null) : null,
          schedule: typeof s === 'object' ? (s.schedule || null) : null,
          conditionalRules: rules.length > 0 ? rules : null
        };
      }
      return s;
    });
    
    await setSites(updated);
    
    // Закрываем модальное окно ПЕРЕД render(), чтобы избежать повторного открытия
    closeConditionalRulesModal();
    
    await render();
  } catch (err) {
    console.error('Error saving conditional rules:', err);
    alert('Ошибка при сохранении правил: ' + err.message);
  }
}

// Инициализация модального окна условных правил
function initConditionalRulesModal() {
  const closeBtn = document.getElementById('closeConditionalRulesModal');
  const cancelBtn = document.getElementById('cancelConditionalRulesBtn');
  const saveBtn = document.getElementById('saveConditionalRulesBtn');
  
  if (closeBtn) {
    // Удаляем старые обработчики перед добавлением нового
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.replaceWith(newCloseBtn);
    newCloseBtn.addEventListener('click', () => {
      closeConditionalRulesModal();
    });
  }
  if (cancelBtn) {
    // Удаляем старые обработчики перед добавлением нового
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.replaceWith(newCancelBtn);
    newCancelBtn.addEventListener('click', () => {
      closeConditionalRulesModal();
    });
  }
  if (saveBtn) {
    // Удаляем старые обработчики перед добавлением нового
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);
    newSaveBtn.addEventListener('click', () => {
      saveConditionalRules();
    });
  }
  
  // Закрытие по клику вне модального окна
  const modal = document.getElementById('conditionalRulesModalBack');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeConditionalRulesModal();
      }
    });
  }
  
  // Закрытие по Escape (используем один обработчик на документе, не добавляем каждый раз)
  if (!window._conditionalRulesEscapeHandler) {
    window._conditionalRulesEscapeHandler = (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('conditionalRulesModalBack');
        if (modal && modal.style.display !== 'none') {
          closeConditionalRulesModal();
        }
      }
    };
    document.addEventListener('keydown', window._conditionalRulesEscapeHandler);
  }
}

// ---------- render ----------
async function render() {
  try {
    console.log("render() вызван");
    let sites = await getSites();
    const allSitesCount = sites.length;
    console.log("Загружено сайтов:", allSitesCount);
    
    // Применяем фильтр по категории
    if (currentCategoryFilter !== 'all' && window.categories) {
      sites = window.categories.filterSitesByCategory(sites, currentCategoryFilter);
    }
    
    if (countNode) {
      countNode.textContent = String(allSitesCount);
    } else {
      console.error("countNode не найден!");
    }
    
    if (!listNode) {
      console.error("listNode не найден!");
      return;
    }
    
    listNode.innerHTML = "";

    if (!sites.length) {
      const emptyText = currentCategoryFilter === 'all'
        ? (window.i18n?.t('options.emptyList') || "Пока пусто. Добавь первый сайт выше.")
        : "Нет сайтов в этой категории";
      listNode.appendChild(el("div", { class: "item" }, [
        el("div", { class: "muted" }, [emptyText]),
        el("div", {}, ["🙂"])
      ]));
      // Скрываем панель групповых операций если список пуст
      const groupOpsBar = document.getElementById('groupOperationsBar');
      if (groupOpsBar) groupOpsBar.style.display = 'none';
      return;
    }

    sites.forEach((site, index) => {
      const host = typeof site === 'string' ? site : site.host;
      const schedule = typeof site === 'object' ? site.schedule : null;
      const category = typeof site === 'object' ? site.category : null;
      
      const deleteNote = window.i18n?.t('options.deleteNote') || "Удаление — только через испытание.";
      
      // Чекбокс для выбора
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "site-checkbox";
      checkbox.dataset.host = host;
      checkbox.addEventListener("change", updateGroupOperationsBar);
      
      // Отображаем категорию
      const categoryInfo = category ? el("div", { class: "muted", style: "font-size: 11px; margin-top: 4px;" }, [
        `📁 ${category}`
      ]) : null;
      
      // Отображаем статус расписания
      const scheduleInfo = [];
      if (schedule && window.schedule) {
        const isActive = window.schedule.isScheduleActive(schedule);
        const modeNames = {
          'always': 'Всегда',
          'workHours': 'Рабочие часы',
          'weekends': 'Выходные',
          'custom': 'Кастомное'
        };
        const modeName = modeNames[schedule.mode] || schedule.mode;
        scheduleInfo.push(el("div", { class: "muted", style: "font-size: 11px; margin-top: 4px;" }, [
          `${isActive ? '✓' : '○'} ${modeName}`
        ]));
      }
      
      // Отображаем условные правила
      const conditionalRulesInfo = [];
      if (typeof site === 'object' && site.conditionalRules && Array.isArray(site.conditionalRules) && site.conditionalRules.length > 0) {
        const activeRules = site.conditionalRules.filter(r => r.enabled);
        if (activeRules.length > 0) {
          conditionalRulesInfo.push(el("div", { class: "muted", style: "font-size: 11px; margin-top: 4px; color: var(--accent);" }, [
            `⚙️ ${activeRules.length} условных правил`
          ]));
        }
      }
      
      const left = el("div", { style: "display: flex; gap: 12px; align-items: center; flex: 1;" }, [
        checkbox,
        el("div", {}, [
          el("div", { class: "host" }, [host]),
          categoryInfo,
          ...scheduleInfo,
          ...conditionalRulesInfo,
          el("div", { class: "muted" }, [deleteNote])
        ].filter(Boolean))
      ]);

      // Создаем кнопки действий
      const actionsDiv = el("div", { style: "display: flex; gap: 8px; align-items: center;" }, []);
      
      // Кнопка настройки расписания
      const scheduleBtn = document.createElement("button");
      scheduleBtn.className = "btn";
      scheduleBtn.textContent = "📅";
      scheduleBtn.title = "Настроить расписание";
      scheduleBtn.style.fontSize = "14px";
      scheduleBtn.style.padding = "6px 10px";
      scheduleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openScheduleModal(host, site);
      });
      actionsDiv.appendChild(scheduleBtn);
      
      // Кнопка условных правил
      const rulesBtn = document.createElement("button");
      rulesBtn.className = "btn";
      rulesBtn.textContent = "⚙️";
      rulesBtn.title = "Условные правила";
      rulesBtn.style.fontSize = "14px";
      rulesBtn.style.padding = "6px 10px";
      rulesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openConditionalRulesModal(host, site);
      });
      actionsDiv.appendChild(rulesBtn);
      
      // Кнопка удаления
      const delBtn = document.createElement("button");
      delBtn.className = "btn danger";
      delBtn.textContent = window.i18n?.t('options.confirmDelete') || "Удалить";
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Кнопка удаления нажата для:", host, "индекс:", index);
        openDeleteModal(host);
      });
      actionsDiv.appendChild(delBtn);

      const item = el("div", { class: "item" }, [left, actionsDiv]);
      listNode.appendChild(item);
      
      console.log("Создана кнопка удаления для:", host);
    });
    
    // Обновляем панель групповых операций
    updateGroupOperationsBar();
    
    console.log("Рендеринг завершен, создано", sites.length, "элементов");
  } catch (err) {
    console.error("Ошибка при рендеринге списка:", err);
  }
}

// Обновление панели групповых операций
function updateGroupOperationsBar() {
  const groupOpsBar = document.getElementById('groupOperationsBar');
  const selectedCountEl = document.getElementById('selectedCount');
  const checkboxes = document.querySelectorAll('.site-checkbox:checked');
  const selectedCount = checkboxes.length;
  
  if (selectedCountEl) {
    selectedCountEl.textContent = `${selectedCount} выбрано`;
  }
  
  if (groupOpsBar) {
    groupOpsBar.style.display = selectedCount > 0 ? 'block' : 'none';
  }
  
  // Обновляем состояние кнопок
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkCategoryBtn = document.getElementById('bulkCategoryBtn');
  const bulkScheduleBtn = document.getElementById('bulkScheduleBtn');
  
  const hasSelection = selectedCount > 0;
  if (bulkDeleteBtn) bulkDeleteBtn.disabled = !hasSelection;
  if (bulkCategoryBtn) bulkCategoryBtn.disabled = !hasSelection;
  if (bulkScheduleBtn) bulkScheduleBtn.disabled = !hasSelection;
}

// Функции для режима разработки
async function loadDevMode() {
  try {
    const data = await chrome.storage.local.get({ devMode: false });
    devMode = data.devMode || false;
    if (devModeCheckbox) {
      devModeCheckbox.checked = devMode;
    }
  } catch (err) {
    console.error('Error loading dev mode:', err);
  }
}

async function saveDevMode(enabled) {
  try {
    devMode = enabled;
    await chrome.storage.local.set({ devMode: enabled });
  } catch (err) {
    console.error('Error saving dev mode:', err);
  }
}

// Проверка загрузки скрипта
console.log("options.js загружен");

// Проверка наличия всех элементов
function checkElements() {
  const elements = {
    listNode: document.getElementById("list"),
    countNode: document.getElementById("count"),
    input: document.getElementById("manualInput"),
    modalBack: document.getElementById("modalBack"),
    targetHostNode: document.getElementById("targetHost"),
    confirmDeleteBtn: document.getElementById("confirmDelete")
  };
  
  console.log("Проверка элементов:", elements);
  
  for (const [name, el] of Object.entries(elements)) {
    if (!el) {
      console.error(`Элемент ${name} не найден!`);
    } else {
      console.log(`✓ ${name} найден`);
    }
  }
}

// Функция обновления фильтра категорий
async function updateCategoryFilter() {
  if (!categoryFilter || !window.categories) {
    return;
  }
  
  try {
    const sites = await getSites();
    const categories = new Set();
    
    // Собираем все категории из сайтов
    sites.forEach(site => {
      if (typeof site === 'object' && site.category) {
        categories.add(site.category);
      }
    });
    
    // Получаем все доступные категории
    const allCategories = window.categories.getCategories();
    allCategories.forEach(cat => categories.add(cat));
    
    // Сохраняем текущее значение
    const currentValue = categoryFilter.value;
    
    // Очищаем и заполняем селект
    categoryFilter.innerHTML = '<option value="all">Все категории</option>';
    
    // Сортируем категории и добавляем в селект
    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если оно все еще существует
    if (currentValue && Array.from(categoryFilter.options).some(opt => opt.value === currentValue)) {
      categoryFilter.value = currentValue;
    } else {
      categoryFilter.value = 'all';
      currentCategoryFilter = 'all';
    }
  } catch (err) {
    console.error('Error updating category filter:', err);
  }
}

// Функции для работы с достижениями
async function renderAchievements() {
  if (!window.achievements) {
    console.error('Achievements module not loaded');
    return;
  }
  
  const achievementsListEl = document.getElementById('achievementsList');
  if (!achievementsListEl) {
    return;
  }
  
  try {
    const achievementsData = await window.achievements.getAchievements();
    const stats = await window.stats.getStats();
    const sites = await getSites();
    
    const progress = await window.achievements.getAchievementProgress(stats, sites);
    const definitions = window.achievements.getAllAchievementDefinitions();
    
    if (definitions.length === 0) {
      achievementsListEl.innerHTML = '<div class="muted">Достижения недоступны</div>';
      return;
    }
    
    const unlockedCount = achievementsData.unlocked?.length || 0;
    const totalCount = definitions.length;
    
    achievementsListEl.innerHTML = `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <div class="h1">${unlockedCount} / ${totalCount}</div>
        <div class="muted">Достижений разблокировано</div>
        <div class="space"></div>
        <div class="progressWrap" style="height: 12px;">
          <div class="progressBar" style="width: ${Math.round((unlockedCount / totalCount) * 100)}%;"></div>
        </div>
      </div>
    `;
    
    const achievementsGrid = document.createElement('div');
    achievementsGrid.style.display = 'grid';
    achievementsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    achievementsGrid.style.gap = '12px';
    
    definitions.forEach(def => {
      const prog = progress[def.id] || { unlocked: false, progress: 0, current: 0, target: 1 };
      const isUnlocked = achievementsData.unlocked?.includes(def.id) || false;
      
      const achievementCard = document.createElement('div');
      achievementCard.className = 'card';
      achievementCard.style.padding = '16px';
      achievementCard.style.opacity = isUnlocked ? '1' : '0.6';
      achievementCard.style.border = isUnlocked ? '2px solid var(--accent)' : '1px solid var(--border)';
      
      achievementCard.innerHTML = `
        <div style="font-size: 32px; text-align: center; margin-bottom: 8px;">${def.icon}</div>
        <div style="font-weight: 600; text-align: center; margin-bottom: 4px;">${def.name}</div>
        <div class="muted" style="font-size: 11px; text-align: center; margin-bottom: 8px;">${def.description}</div>
        ${isUnlocked 
          ? '<div style="color: var(--accent); text-align: center; font-size: 12px; font-weight: 600;">✓ Разблокировано</div>'
          : `<div class="progressWrap" style="height: 6px; margin-top: 8px;">
               <div class="progressBar" style="width: ${prog.progress}%;"></div>
             </div>
             <div class="muted" style="font-size: 10px; text-align: center; margin-top: 4px;">${prog.current} / ${prog.target}</div>`
        }
      `;
      
      achievementsGrid.appendChild(achievementCard);
    });
    
    achievementsListEl.appendChild(achievementsGrid);
  } catch (err) {
    console.error('Error rendering achievements:', err);
    achievementsListEl.innerHTML = '<div class="muted">Ошибка при загрузке достижений</div>';
  }
}

// Функции для работы со статистикой
async function renderStats() {
  if (!window.stats) {
    console.error('Stats module not loaded');
    return;
  }
  
  try {
    const stats = await window.stats.getStats();
    if (!stats) {
      document.getElementById('totalBlocks').textContent = '0';
      document.getElementById('streakDays').textContent = '0';
      document.getElementById('totalSites').textContent = '0';
      document.getElementById('statsBySite').innerHTML = '<div class="muted">Статистика недоступна</div>';
      return;
    }
    
    // Общая статистика
    document.getElementById('totalBlocks').textContent = String(stats.totalBlocks || 0);
    document.getElementById('streakDays').textContent = String(stats.streakDays || 0);
    document.getElementById('totalSites').textContent = String(stats.totalSites || 0);
    
    // Статистика по сайтам
    const statsBySiteEl = document.getElementById('statsBySite');
    const sites = Object.entries(stats.bySite || {});
    
    if (sites.length === 0) {
      statsBySiteEl.innerHTML = '<div class="muted">Нет статистики по сайтам</div>';
    } else {
      // Сортируем по количеству блокировок
      sites.sort((a, b) => b[1].blocks - a[1].blocks);
      
      statsBySiteEl.innerHTML = sites.map(([host, siteStats]) => {
        const firstDate = new Date(siteStats.firstBlocked).toLocaleDateString();
        const lastDate = new Date(siteStats.lastBlocked).toLocaleDateString();
        return `
          <div class="card" style="padding: 16px; margin-bottom: 8px;">
            <div class="row" style="justify-content: space-between; align-items: center;">
              <div>
                <div class="host">${host}</div>
                <div class="muted">Блокировок: ${siteStats.blocks}</div>
                <div class="muted" style="font-size: 11px;">Первая: ${firstDate} | Последняя: ${lastDate}</div>
              </div>
              <div class="kbd">${siteStats.blocks}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error rendering stats:', err);
    document.getElementById('statsBySite').innerHTML = '<div class="muted">Ошибка при загрузке статистики</div>';
  }
}

// Переключение вкладок
const tabSites = document.getElementById('tabSites');
const tabStats = document.getElementById('tabStats');
const tabAchievements = document.getElementById('tabAchievements');
const sitesTab = document.getElementById('sitesTab');
const statsTab = document.getElementById('statsTab');
const achievementsTab = document.getElementById('achievementsTab');

// Убеждаемся, что вкладка сайтов видна по умолчанию
if (sitesTab) {
  sitesTab.style.display = 'block';
}
if (statsTab) {
  statsTab.style.display = 'none';
}
if (achievementsTab) {
  achievementsTab.style.display = 'none';
}

// Проверяем основные табы (tabTempWhitelist может отсутствовать)
if (tabSites && tabStats && tabAchievements && sitesTab && statsTab && achievementsTab) {
  tabSites.addEventListener('click', () => {
    sitesTab.style.display = 'block';
    statsTab.style.display = 'none';
    achievementsTab.style.display = 'none';
    tabSites.style.borderBottomColor = 'var(--accent)';
    tabStats.style.borderBottomColor = 'transparent';
    tabAchievements.style.borderBottomColor = 'transparent';
    // Перерисовываем список при переключении на вкладку сайтов
    render().catch(err => console.error('Error rendering sites:', err));
  });
  
  tabStats.addEventListener('click', async () => {
    sitesTab.style.display = 'none';
    statsTab.style.display = 'block';
    achievementsTab.style.display = 'none';
    tabSites.style.borderBottomColor = 'transparent';
    tabStats.style.borderBottomColor = 'var(--accent)';
    tabAchievements.style.borderBottomColor = 'transparent';
    await renderStats();
  });
  
  tabAchievements.addEventListener('click', async () => {
    sitesTab.style.display = 'none';
    statsTab.style.display = 'none';
    achievementsTab.style.display = 'block';
    tabSites.style.borderBottomColor = 'transparent';
    tabStats.style.borderBottomColor = 'transparent';
    tabAchievements.style.borderBottomColor = 'var(--accent)';
    await renderAchievements();
  });
} else {
  console.error('[Brain Defender] Tab elements not found, tab switching will not work');
}

// Экспорт статистики
const exportStatsBtn = document.getElementById('exportStatsBtn');
if (exportStatsBtn) {
  exportStatsBtn.addEventListener('click', async () => {
    if (!window.stats) {
      alert('Модуль статистики не загружен');
      return;
    }
    
    try {
      const json = await window.stats.exportStats('json');
      if (!json) {
        alert('Не удалось экспортировать статистику');
        return;
      }
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brain-defender-stats-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting stats:', err);
      alert('Ошибка при экспорте статистики');
    }
  });
}

// Очистка статистики
const clearStatsBtn = document.getElementById('clearStatsBtn');
if (clearStatsBtn) {
  clearStatsBtn.addEventListener('click', async () => {
    if (!confirm('Вы уверены, что хотите очистить всю статистику? Это действие нельзя отменить.')) {
      return;
    }
    
    if (!window.stats) {
      alert('Модуль статистики не загружен');
      return;
    }
    
    try {
      const success = await window.stats.clearStats();
      if (success) {
        alert('Статистика очищена');
        await renderStats();
      } else {
        alert('Не удалось очистить статистику');
      }
    } catch (err) {
      console.error('Error clearing stats:', err);
      alert('Ошибка при очистке статистики');
    }
  });
}

// Инициализация i18n и рендеринг
(async () => {
  // Ждем загрузки DOM
  if (document.readyState === "loading") {
    await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
  }
  
  console.log("DOM загружен");
  checkElements();
  
  // Инициализация модального окна расписания
  initScheduleModal();
  
  // Инициализация модального окна условных правил
  initConditionalRulesModal();
  
  // Выполняем миграцию данных
  if (window.migration && window.migration.migrate) {
    const migrationResult = await window.migration.migrate();
    console.log('[Options] Migration result:', migrationResult);
  }
  
  // Инициализация статистики
  if (window.stats && window.stats.initStats) {
    await window.stats.initStats();
  }
  
  // Инициализация достижений
  if (window.achievements && window.achievements.initAchievements) {
    await window.achievements.initAchievements();
  }
  
  // Загружаем режим разработки
  await loadDevMode();
  
  // Обработчик режима разработки
  if (devModeCheckbox) {
    devModeCheckbox.addEventListener('change', async (e) => {
      await saveDevMode(e.target.checked);
    });
  }
  
  // Обновляем фильтр категорий
  updateCategoryFilter();
  
  // Обработчик фильтра категорий
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      render();
    });
  }
  
  // Обработчики шаблонов расписаний
  const applyWorkdaysTemplate = document.getElementById('applyWorkdaysTemplate');
  const applyWeekendsTemplate = document.getElementById('applyWeekendsTemplate');
  const applyPerDayTemplate = document.getElementById('applyPerDayTemplate');
  const applyVacationTemplate = document.getElementById('applyVacationTemplate');
  
  async function applyScheduleTemplate(templateName) {
    if (!window.schedule || !window.schedule.createScheduleTemplate) {
      alert('Модуль расписаний не загружен');
      return;
    }
    
    const checkboxes = document.querySelectorAll('.site-checkbox:checked');
    const hostsToUpdate = checkboxes.length > 0 
      ? Array.from(checkboxes).map(cb => cb.dataset.host)
      : null; // Если ничего не выбрано, применяем ко всем
    
    const template = window.schedule.createScheduleTemplate(templateName);
    
    try {
      const sites = await getSites();
      const normalizeFn = window.utils && window.utils.normalizeHost 
        ? window.utils.normalizeHost 
        : (h) => h.toLowerCase().replace(/^www\./, "");
      
      let hostsToUpdateSet = null;
      if (hostsToUpdate) {
        hostsToUpdateSet = new Set(hostsToUpdate.map(h => {
          const normalized = normalizeFn(h);
          return normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        }).filter(Boolean));
      }
      
      const updated = sites.map(site => {
        const host = typeof site === 'string' ? site : site.host;
        const normalized = normalizeFn(host);
        const normalizedHost = normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        
        // Если есть выбор, применяем только к выбранным
        if (hostsToUpdateSet && (!normalizedHost || !hostsToUpdateSet.has(normalizedHost))) {
          return site;
        }
        
        // Применяем шаблон
        return {
          host: typeof site === 'string' ? site : site.host,
          addedAt: typeof site === 'object' ? (site.addedAt || Date.now()) : Date.now(),
          category: typeof site === 'object' ? (site.category || null) : null,
          schedule: { ...template }
        };
      });
      
      await setSites(updated);
      await render();
      
      const count = hostsToUpdateSet ? hostsToUpdateSet.size : sites.length;
      alert(`Шаблон "${templateName}" применен к ${count} сайтам`);
    } catch (err) {
      console.error('Error applying schedule template:', err);
      alert('Ошибка при применении шаблона: ' + err.message);
    }
  }
  
  if (applyWorkdaysTemplate) {
    applyWorkdaysTemplate.addEventListener('click', () => applyScheduleTemplate('workdays'));
  }
  if (applyWeekendsTemplate) {
    applyWeekendsTemplate.addEventListener('click', () => applyScheduleTemplate('weekends'));
  }
  if (applyPerDayTemplate) {
    applyPerDayTemplate.addEventListener('click', () => applyScheduleTemplate('perDayWork'));
  }
  if (applyVacationTemplate) {
    applyVacationTemplate.addEventListener('click', () => applyScheduleTemplate('vacation'));
  }
  
  // Экспорт списка
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const sites = await getSites();
        const json = JSON.stringify(sites, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brain-defender-sites-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exporting sites:', err);
        alert('Ошибка при экспорте списка');
      }
    });
  }
  
  // Импорт списка
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Проверка размера файла (максимум 100KB для sync storage)
        const MAX_FILE_SIZE = 100 * 1024; // 100KB
        if (file.size > MAX_FILE_SIZE) {
          alert(`Файл слишком большой (${Math.round(file.size / 1024)}KB). Максимальный размер: 100KB.`);
          importFile.value = '';
          return;
        }
        
        const text = await file.text();
        
        // Проверка размера JSON строки
        if (text.length > MAX_FILE_SIZE) {
          alert(`Данные слишком большие (${Math.round(text.length / 1024)}KB). Максимальный размер: 100KB.`);
          importFile.value = '';
          return;
        }
        
        let imported;
        try {
          imported = JSON.parse(text);
        } catch (parseErr) {
          alert('Неверный формат JSON файла: ' + parseErr.message);
          importFile.value = '';
          return;
        }
        
        if (!Array.isArray(imported)) {
          alert('Неверный формат файла. Ожидается массив сайтов.');
          importFile.value = '';
          return;
        }
        
        // Проверка максимального количества сайтов
        const MAX_SITES = 1000;
        if (imported.length > MAX_SITES) {
          alert(`Слишком много сайтов (${imported.length}). Максимальное количество: ${MAX_SITES}.`);
          importFile.value = '';
          return;
        }
        
        if (imported.length === 0) {
          alert('Файл пуст. Нет сайтов для импорта.');
          importFile.value = '';
          return;
        }
        
        // Валидация структуры каждого элемента
        const validationErrors = [];
        for (let i = 0; i < imported.length; i++) {
          const item = imported[i];
          
          // Проверка типа элемента
          if (typeof item !== 'string' && typeof item !== 'object') {
            validationErrors.push(`Элемент ${i + 1}: неверный тип (ожидается строка или объект)`);
            continue;
          }
          
          // Если объект, проверяем структуру
          if (typeof item === 'object') {
            if (item === null || Array.isArray(item)) {
              validationErrors.push(`Элемент ${i + 1}: неверный тип объекта`);
              continue;
            }
            
            // Проверка наличия host
            if (!item.host && typeof item !== 'string') {
              validationErrors.push(`Элемент ${i + 1}: отсутствует поле host`);
              continue;
            }
            
            // Проверка типов полей
            if (item.addedAt !== undefined && typeof item.addedAt !== 'number') {
              validationErrors.push(`Элемент ${i + 1}: поле addedAt должно быть числом`);
            }
            if (item.category !== undefined && item.category !== null && typeof item.category !== 'string') {
              validationErrors.push(`Элемент ${i + 1}: поле category должно быть строкой или null`);
            }
            if (item.schedule !== undefined && item.schedule !== null && typeof item.schedule !== 'object') {
              validationErrors.push(`Элемент ${i + 1}: поле schedule должно быть объектом или null`);
            }
          }
          
          // Проверка длины строки host (если строка)
          if (typeof item === 'string' && item.length > 253) {
            validationErrors.push(`Элемент ${i + 1}: домен слишком длинный (максимум 253 символа)`);
          }
        }
        
        if (validationErrors.length > 0) {
          const errorMsg = `Обнаружены ошибки валидации:\n\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... и еще ${validationErrors.length - 10} ошибок` : ''}`;
          alert(errorMsg);
          importFile.value = '';
          return;
        }
        
        if (!confirm(`Импортировать ${imported.length} сайтов? Существующие данные будут заменены.`)) {
          importFile.value = '';
          return;
        }
        
        // Валидация и нормализация импортированных данных
        const normalized = imported.map(item => {
          if (typeof item === 'string') {
            return {
              host: normalizeHost(item),
              addedAt: Date.now(),
              category: null,
              schedule: null
            };
          }
          return {
            host: normalizeHost(item.host || item),
            addedAt: item.addedAt || Date.now(),
            category: item.category || null,
            schedule: item.schedule || null
          };
        }).filter(item => item.host);
        
        // Проверка размера после нормализации (приблизительная оценка)
        const estimatedSize = JSON.stringify(normalized).length;
        if (estimatedSize > MAX_FILE_SIZE) {
          alert(`После нормализации данные слишком большие (${Math.round(estimatedSize / 1024)}KB). Максимальный размер: 100KB.`);
          importFile.value = '';
          return;
        }
        
        await setSites(normalized);
        await render();
        alert(`Импортировано ${normalized.length} сайтов`);
        
        // Очищаем input
        importFile.value = '';
      } catch (err) {
        console.error('Error importing sites:', err);
        alert('Ошибка при импорте: ' + err.message);
        importFile.value = '';
      }
    });
  }
  
  // Инициализация i18n
  if (window.i18n && window.i18n.init) {
    await window.i18n.init();
    
    // Устанавливаем текущий язык в селект
    if (languageSelect) {
      const currentLang = await window.i18n.getLanguage();
      languageSelect.value = currentLang;
    }
    
    // Применяем переводы
    if (window.i18n.applyLanguage) {
      window.i18n.applyLanguage();
    }
  }
  
  // Обработчики групповых операций
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkCategoryBtn = document.getElementById('bulkCategoryBtn');
  const bulkScheduleBtn = document.getElementById('bulkScheduleBtn');
  const bulkAddBtn = document.getElementById('bulkAddBtn');
  const bulkAddInput = document.getElementById('bulkAddInput');
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.site-checkbox');
      checkboxes.forEach(cb => cb.checked = true);
      updateGroupOperationsBar();
    });
  }
  
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.site-checkbox');
      checkboxes.forEach(cb => cb.checked = false);
      updateGroupOperationsBar();
    });
  }
  
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.site-checkbox:checked');
      const hostsToDelete = Array.from(checkboxes).map(cb => cb.dataset.host);
      
      if (hostsToDelete.length === 0) return;
      
      if (!confirm(`Удалить ${hostsToDelete.length} сайтов?`)) {
        return;
      }
      
      try {
        const sites = await getSites();
        const hostsToDeleteSet = new Set(hostsToDelete.map(h => {
          const normalized = normalizeHost(h);
          return normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        }).filter(Boolean));
        
        const remaining = sites.filter(site => {
          const host = typeof site === 'string' ? site : site.host;
          const normalized = normalizeHost(host);
          const normalizedHost = normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
          return normalizedHost && !hostsToDeleteSet.has(normalizedHost);
        });
        
        await setSites(remaining);
        await render();
      } catch (err) {
        console.error('Error bulk deleting sites:', err);
        alert('Ошибка при удалении сайтов');
      }
    });
  }
  
  if (bulkCategoryBtn) {
    bulkCategoryBtn.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.site-checkbox:checked');
      const hostsToUpdate = Array.from(checkboxes).map(cb => cb.dataset.host);
      
      if (hostsToUpdate.length === 0) return;
      
      if (!window.categories) {
        alert('Модуль категорий не загружен');
        return;
      }
      
      const categories = window.categories.getCategories();
      const selectedCategory = prompt(`Выберите категорию для ${hostsToUpdate.length} сайтов:\n\n${categories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}\n\nВведите номер или название:`, '');
      
      if (!selectedCategory) return;
      
      let category = selectedCategory.trim();
      // Пробуем найти по номеру
      const categoryNum = parseInt(category);
      if (!isNaN(categoryNum) && categoryNum > 0 && categoryNum <= categories.length) {
        category = categories[categoryNum - 1];
      }
      
      // Проверяем, существует ли категория
      if (!categories.includes(category)) {
        // Создаем новую категорию
        window.categories.addCategory(category);
      }
      
      try {
        const sites = await getSites();
        const hostsToUpdateSet = new Set(hostsToUpdate.map(h => {
          const normalized = normalizeHost(h);
          return normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        }).filter(Boolean));
        
        const updated = sites.map(site => {
          const host = typeof site === 'string' ? site : site.host;
          const normalized = normalizeHost(host);
          const normalizedHost = normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
          
          if (normalizedHost && hostsToUpdateSet.has(normalizedHost)) {
            return {
              host: typeof site === 'string' ? site : site.host,
              addedAt: typeof site === 'object' ? (site.addedAt || Date.now()) : Date.now(),
              category: category,
              schedule: typeof site === 'object' ? (site.schedule || null) : null
            };
          }
          return site;
        });
        
        await setSites(updated);
        await render();
      } catch (err) {
        console.error('Error bulk updating category:', err);
        alert('Ошибка при изменении категорий');
      }
    });
  }
  
  if (bulkScheduleBtn) {
    bulkScheduleBtn.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.site-checkbox:checked');
      const hostsToUpdate = Array.from(checkboxes).map(cb => cb.dataset.host);
      
      if (hostsToUpdate.length === 0) return;
      
      if (!window.schedule) {
        alert('Модуль расписаний не загружен');
        return;
      }
      
      const scheduleModes = [
        { value: 'always', label: 'Всегда' },
        { value: 'workHours', label: 'Рабочие часы' },
        { value: 'weekends', label: 'Выходные' },
        { value: 'custom', label: 'Кастомное' }
      ];
      
      const modeChoice = prompt(`Выберите режим расписания для ${hostsToUpdate.length} сайтов:\n\n${scheduleModes.map((m, idx) => `${idx + 1}. ${m.label}`).join('\n')}\n\nВведите номер:`, '1');
      
      if (!modeChoice) return;
      
      const modeNum = parseInt(modeChoice);
      if (isNaN(modeNum) || modeNum < 1 || modeNum > scheduleModes.length) {
        alert('Неверный выбор');
        return;
      }
      
      const selectedMode = scheduleModes[modeNum - 1].value;
      const schedule = window.schedule.createDefaultSchedule();
      schedule.mode = selectedMode;
      
      try {
        const sites = await getSites();
        const hostsToUpdateSet = new Set(hostsToUpdate.map(h => {
          const normalized = normalizeHost(h);
          return normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        }).filter(Boolean));
        
        const updated = sites.map(site => {
          const host = typeof site === 'string' ? site : site.host;
          const normalized = normalizeHost(host);
          const normalizedHost = normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
          
          if (normalizedHost && hostsToUpdateSet.has(normalizedHost)) {
            return {
              host: typeof site === 'string' ? site : site.host,
              addedAt: typeof site === 'object' ? (site.addedAt || Date.now()) : Date.now(),
              category: typeof site === 'object' ? (site.category || null) : null,
              schedule: schedule
            };
          }
          return site;
        });
        
        await setSites(updated);
        await render();
      } catch (err) {
        console.error('Error bulk updating schedule:', err);
        alert('Ошибка при изменении расписаний');
      }
    });
  }
  
  if (bulkAddBtn && bulkAddInput) {
    bulkAddBtn.addEventListener('click', async () => {
      const text = bulkAddInput.value.trim();
      if (!text) {
        alert('Введите домены для добавления');
        return;
      }
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        alert('Нет доменов для добавления');
        return;
      }
      
      try {
        const sites = await getSites();
        const existingHosts = new Set(sites.map(s => {
          const host = typeof s === 'string' ? s : s.host;
          const normalized = normalizeHost(host);
          return normalized ? normalized.toLowerCase().replace(/^www\./, "") : null;
        }).filter(Boolean));
        
        const newSites = [];
        const errors = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const normalized = normalizeHost(line);
          
          if (!normalized) {
            errors.push(`Строка ${i + 1}: "${line}" - неверный формат домена`);
            continue;
          }
          
          const normalizedHost = normalized.toLowerCase().replace(/^www\./, "");
          if (existingHosts.has(normalizedHost)) {
            continue; // Пропускаем уже существующие
          }
          
          newSites.push({
            host: normalizedHost,
            addedAt: Date.now(),
            category: null,
            schedule: null
          });
          
          existingHosts.add(normalizedHost);
        }
        
        if (errors.length > 0) {
          const errorMsg = `Ошибки при добавлении:\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... и еще ${errors.length - 10} ошибок` : ''}`;
          alert(errorMsg);
        }
        
        if (newSites.length === 0) {
          alert('Нет новых сайтов для добавления');
          bulkAddInput.value = '';
          return;
        }
        
        const allSites = [...sites, ...newSites];
        await setSites(allSites);
        bulkAddInput.value = '';
        await render();
        
        alert(`Добавлено ${newSites.length} сайтов${errors.length > 0 ? `, ${errors.length} ошибок` : ''}`);
      } catch (err) {
        console.error('Error bulk adding sites:', err);
        alert('Ошибка при добавлении сайтов: ' + err.message);
      }
    });
  }
  
  console.log("Запускаем render()");
  await render();
})();