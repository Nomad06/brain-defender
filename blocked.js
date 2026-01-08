async function pickPhrase() {
    try {
      if (!window.i18n) {
        console.error('i18n not initialized');
        return 'Stay focused. You got this.';
      }
      
      const phrases = window.i18n.getPhrases('blocked');
      if (!phrases || phrases.length === 0) {
        return 'Stay focused. You got this.';
      }
    
    // стараемся не повторять подряд
    let last = -1;
    try {
      // Пробуем localStorage (работает в обычных страницах)
      const stored = localStorage.getItem("lastPhraseIdx");
      if (stored !== null) last = Number(stored);
    } catch {
      // Если localStorage недоступен, используем chrome.storage
      try {
        const data = await chrome.storage.local.get({ lastPhraseIdx: -1 });
        last = Number(data.lastPhraseIdx || -1);
      } catch {
        // Если и chrome.storage недоступен, просто используем -1
      }
    }
    
    let idx = Math.floor(Math.random() * phrases.length);
    if (phrases.length > 2 && idx === last) idx = (idx + 1) % phrases.length;
    
    try {
      localStorage.setItem("lastPhraseIdx", String(idx));
    } catch {
      try {
        await chrome.storage.local.set({ lastPhraseIdx: idx });
      } catch {
        // Игнорируем ошибки сохранения
      }
    }
    
      return phrases[idx];
    } catch (err) {
      console.error('Error picking phrase:', err);
      return 'Stay focused. You got this.';
    }
  }
  
  function getParam(name) {
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }
  
  function formatTarget(rawUrl) {
    try {
      const u = new URL(rawUrl);
      const host = (u.hostname || "").toLowerCase().replace(/^www\./, "");
      return { host, full: rawUrl };
    } catch {
      const unknownText = window.i18n?.t('blocked.blocked') || 'blocked';
      return { host: unknownText, full: rawUrl || "" };
    }
  }
  
  // Инициализация i18n и загрузка контента
  (async () => {
    // Ждем инициализации i18n
    if (window.i18n && window.i18n.init) {
      await window.i18n.init();
    }
    
    const raw = getParam("url") || "";
    const target = formatTarget(raw);
    
    // Инициализация с проверкой элементов
    const targetEl = document.getElementById("target");
    const phraseEl = document.getElementById("phrase");
    
    if (targetEl) {
      const blockedText = window.i18n?.t('blocked.blocked') || 'blocked';
      targetEl.textContent = target.host ? `🚫 ${target.host}` : `🚫 ${blockedText}`;
    }
    
    // Применяем переводы к data-i18n элементам
    if (window.i18n && window.i18n.applyLanguage) {
      window.i18n.applyLanguage();
    }
    
    // Обновление шага 2 с правильным текстом (после применения переводов)
    const step2TextEl = document.getElementById("step2Text");
    if (step2TextEl && window.i18n) {
      const step2Text = window.i18n.t('blocked.step2', { count: '3' });
      step2TextEl.textContent = step2Text;
    }
    
    // Асинхронная загрузка фразы (использует текущий язык)
    if (phraseEl) {
      phraseEl.textContent = await pickPhrase();
    }
  })();

// Упражнения - альтернатива импульсу
(function() {
  // Функции для работы с localStorage
  function getTodayDateKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getLastExerciseDate(type) {
    try {
      const key = `exercise_${type}_${getTodayDateKey()}`;
      const value = localStorage.getItem(key);
      return value ? new Date(value) : null;
    } catch {
      return null;
    }
  }

  function setExerciseDone(type) {
    try {
      const key = `exercise_${type}_${getTodayDateKey()}`;
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  function hasDoneExerciseToday(type) {
    const lastDate = getLastExerciseDate(type);
    if (!lastDate) return false;
    const today = new Date();
    return lastDate.toDateString() === today.toDateString();
  }

  // Элементы DOM
  const alternativeBlock = document.getElementById('alternativeBlock');
  const alreadyDoneToday = document.getElementById('alreadyDoneToday');
  const repeatAnywayBtn = document.getElementById('repeatAnyway');
  const exerciseButtons = document.getElementById('exerciseButtons');
  const eyeExerciseBtn = document.getElementById('eyeExerciseBtn');
  const breathExerciseBtn = document.getElementById('breathExerciseBtn');
  const stretchExerciseBtn = document.getElementById('stretchExerciseBtn');
  const closeTabBtn = document.getElementById('closeTabBtn');
  const eyeExerciseContent = document.getElementById('eyeExerciseContent');
  const eyeCanvas = document.getElementById('eyeCanvas');
  const eyeProgressBar = document.getElementById('eyeProgressBar');
  const stopEyeExerciseBtn = document.getElementById('stopEyeExercise');
  const breathExerciseContent = document.getElementById('breathExerciseContent');
  const breathCanvas = document.getElementById('breathCanvas');
  const breathPhase = document.getElementById('breathPhase');
  const breathProgressBar = document.getElementById('breathProgressBar');
  const stopBreathExerciseBtn = document.getElementById('stopBreathExercise');
  const stretchExerciseContent = document.getElementById('stretchExerciseContent');
  const closeStretchExerciseBtn = document.getElementById('closeStretchExercise');

  if (!alternativeBlock) return;

  // Логика тренировки для глаз - Canvas Follow the Dot
  let eyeAnimationFrame = null;
  let eyeExerciseStartTime = 0;
  let eyeCanvasCtx = null;
  let eyeCanvasWidth = 0;
  let eyeCanvasHeight = 0;
  let eyeDpr = 1;
  const totalEyeDuration = 38000; // 38 секунд

  // Траектории для Follow the Dot (3 сегмента по ~12-13 сек)
  const eyeTrajectories = [
    {
      name: 'lemniscate',
      duration: 13000,
      getPoint: (t) => {
        // Лемниската (∞) - параметрическая форма
        const scale = Math.min(eyeCanvasWidth, eyeCanvasHeight) * 0.3;
        const angle = t * Math.PI * 2;
        const denom = 1 + Math.sin(angle) * Math.sin(angle);
        const x = eyeCanvasWidth / 2 + scale * Math.cos(angle) / denom;
        const y = eyeCanvasHeight / 2 + scale * Math.sin(angle) * Math.cos(angle) / denom;
        return { x, y };
      }
    },
    {
      name: 'circle',
      duration: 12000,
      getPoint: (t) => {
        // Круг
        const radius = Math.min(eyeCanvasWidth, eyeCanvasHeight) * 0.3;
        const angle = t * Math.PI * 2;
        const x = eyeCanvasWidth / 2 + radius * Math.cos(angle);
        const y = eyeCanvasHeight / 2 + radius * Math.sin(angle);
        return { x, y };
      }
    },
    {
      name: 'oval',
      duration: 13000,
      getPoint: (t) => {
        // Овал по диагонали
        const radiusX = Math.min(eyeCanvasWidth, eyeCanvasHeight) * 0.35;
        const radiusY = Math.min(eyeCanvasWidth, eyeCanvasHeight) * 0.2;
        const angle = t * Math.PI * 2;
        const x = eyeCanvasWidth / 2 + radiusX * Math.cos(angle + Math.PI / 4);
        const y = eyeCanvasHeight / 2 + radiusY * Math.sin(angle + Math.PI / 4);
        return { x, y };
      }
    }
  ];

  function initEyeCanvas() {
    if (!eyeCanvas) return;
    
    eyeDpr = window.devicePixelRatio || 1;
    const rect = eyeCanvas.getBoundingClientRect();
    eyeCanvasWidth = rect.width;
    eyeCanvasHeight = rect.height;
    
    eyeCanvas.width = eyeCanvasWidth * eyeDpr;
    eyeCanvas.height = eyeCanvasHeight * eyeDpr;
    eyeCanvas.style.width = eyeCanvasWidth + 'px';
    eyeCanvas.style.height = eyeCanvasHeight + 'px';

    eyeCanvasCtx = eyeCanvas.getContext('2d');
    eyeCanvasCtx.scale(eyeDpr, eyeDpr);
  }

  function drawEyeDot(x, y, trail = []) {
    if (!eyeCanvasCtx) return;
    
    const ctx = eyeCanvasCtx;
    ctx.clearRect(0, 0, eyeCanvasWidth, eyeCanvasHeight);
    
    // Рисуем trail (след)
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(91, 141, 239, 0.2)';
      ctx.lineWidth = 2;
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.stroke();
    }
    
    // Рисуем точку с мягким свечением
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, 'rgba(91, 141, 239, 0.9)');
    gradient.addColorStop(0.5, 'rgba(91, 141, 239, 0.4)');
    gradient.addColorStop(1, 'rgba(91, 141, 239, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Ядро точки
    ctx.fillStyle = 'rgba(91, 141, 239, 1)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function startEyeExercise() {
    if (eyeAnimationFrame) return;
    
    // Останавливаем другие упражнения
    if (breathAnimationFrame) {
      stopBreathExercise(false);
    }
    if (stretchExerciseContent.style.display !== 'none') {
      closeStretchExercise();
    }
    
    eyeExerciseStartTime = Date.now();
    eyeExerciseContent.style.display = 'block';
    exerciseButtons.style.display = 'none';
    alreadyDoneToday.style.display = 'none';
    
    // Небольшая задержка для правильной инициализации Canvas после показа
    setTimeout(() => {
      initEyeCanvas();
      
      const trail = [];
      const maxTrailLength = 30;
      
      function animate() {
        if (!eyeAnimationFrame) return;
        
        const elapsed = Date.now() - eyeExerciseStartTime;
        const progress = Math.min(elapsed / totalEyeDuration, 1);
        
        if (progress >= 1) {
          stopEyeExercise(true);
          return;
        }
        
        // Определяем текущую траекторию
        let cumulativeTime = 0;
        let currentTrajectory = null;
        let localT = 0;
        
        for (let i = 0; i < eyeTrajectories.length; i++) {
          if (elapsed < cumulativeTime + eyeTrajectories[i].duration) {
            currentTrajectory = eyeTrajectories[i];
            localT = (elapsed - cumulativeTime) / eyeTrajectories[i].duration;
            break;
          }
          cumulativeTime += eyeTrajectories[i].duration;
        }
        
        if (currentTrajectory) {
          const point = currentTrajectory.getPoint(localT);
          trail.push({ x: point.x, y: point.y });
          if (trail.length > maxTrailLength) {
            trail.shift();
          }
          drawEyeDot(point.x, point.y, trail);
        }
        
        // Обновляем прогресс-бар
        eyeProgressBar.style.width = (progress * 100) + '%';
        
        eyeAnimationFrame = requestAnimationFrame(animate);
      }
      
      eyeAnimationFrame = requestAnimationFrame(animate);
    }, 50);
  }

  function stopEyeExercise(completed = false) {
    if (eyeAnimationFrame) {
      cancelAnimationFrame(eyeAnimationFrame);
      eyeAnimationFrame = null;
    }
    
    if (eyeCanvasCtx) {
      eyeCanvasCtx.clearRect(0, 0, eyeCanvasWidth, eyeCanvasHeight);
    }
    
    if (completed) {
      setExerciseDone('eyes');
    }
    
    eyeExerciseContent.style.display = 'none';
    exerciseButtons.style.display = 'flex';
    eyeProgressBar.style.width = '0%';
  }

  // Логика дыхания - Breathing Circle
  let breathAnimationFrame = null;
  let breathExerciseStartTime = 0;
  let breathCanvasCtx = null;
  let breathCanvasSize = 0;
  let breathDpr = 1;
  const totalBreathDuration = 30000; // 30 секунд
  
  // Фазы дыхания: вдох 4с, пауза 2с, выдох 6с (повтор 2 раза = 24с) + 6с завершение
  const breathPhases = [
    { name: 'Вдох', duration: 4000, scale: 1.0 },
    { name: 'Пауза', duration: 2000, scale: 1.0 },
    { name: 'Выдох', duration: 6000, scale: 0.3 },
    { name: 'Вдох', duration: 4000, scale: 1.0 },
    { name: 'Пауза', duration: 2000, scale: 1.0 },
    { name: 'Выдох', duration: 6000, scale: 0.3 },
    { name: 'Завершение', duration: 6000, scale: 0.6 }
  ];

  function initBreathCanvas() {
    if (!breathCanvas) return;
    
    breathDpr = window.devicePixelRatio || 1;
    const rect = breathCanvas.getBoundingClientRect();
    breathCanvasSize = Math.min(rect.width, rect.height);
    
    breathCanvas.width = breathCanvasSize * breathDpr;
    breathCanvas.height = breathCanvasSize * breathDpr;
    breathCanvas.style.width = breathCanvasSize + 'px';
    breathCanvas.style.height = breathCanvasSize + 'px';
    
    breathCanvasCtx = breathCanvas.getContext('2d');
    breathCanvasCtx.scale(breathDpr, breathDpr);
  }

  function drawBreathCircle(scale, phaseName) {
    if (!breathCanvasCtx) return;
    
    const ctx = breathCanvasCtx;
    const center = breathCanvasSize / 2;
    const baseRadius = breathCanvasSize * 0.3;
    const currentRadius = baseRadius * scale;
    
    ctx.clearRect(0, 0, breathCanvasSize, breathCanvasSize);
    
    // Внешнее кольцо с градиентом
    const gradient = ctx.createRadialGradient(center, center, currentRadius * 0.7, center, center, currentRadius);
    gradient.addColorStop(0, 'rgba(91, 141, 239, 0.3)');
    gradient.addColorStop(0.5, 'rgba(91, 141, 239, 0.5)');
    gradient.addColorStop(1, 'rgba(91, 141, 239, 0.2)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(center, center, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Внутренний круг
    ctx.fillStyle = 'rgba(91, 141, 239, 0.15)';
    ctx.beginPath();
    ctx.arc(center, center, currentRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function startBreathExercise() {
    if (breathAnimationFrame) return;
    
    // Останавливаем другие упражнения
    if (eyeAnimationFrame) {
      stopEyeExercise(false);
    }
    if (stretchExerciseContent.style.display !== 'none') {
      closeStretchExercise();
    }
    
    breathExerciseStartTime = Date.now();
    breathExerciseContent.style.display = 'block';
    exerciseButtons.style.display = 'none';
    alreadyDoneToday.style.display = 'none';
    
    // Небольшая задержка для правильной инициализации Canvas после показа
    setTimeout(() => {
      initBreathCanvas();
      
      function animate() {
        if (!breathAnimationFrame) return;
        
        const elapsed = Date.now() - breathExerciseStartTime;
        const progress = Math.min(elapsed / totalBreathDuration, 1);
        
        if (progress >= 1) {
          stopBreathExercise(true);
          return;
        }
        
        // Определяем текущую фазу
        let cumulativeTime = 0;
        let currentPhase = null;
        let localT = 0;
        
        for (let i = 0; i < breathPhases.length; i++) {
          if (elapsed < cumulativeTime + breathPhases[i].duration) {
            currentPhase = breathPhases[i];
            localT = (elapsed - cumulativeTime) / breathPhases[i].duration;
            break;
          }
          cumulativeTime += breathPhases[i].duration;
        }
        
        if (currentPhase) {
          breathPhase.textContent = currentPhase.name;
          
          // Плавная интерполяция scale в зависимости от фазы
          let scale = currentPhase.scale;
          if (currentPhase.name === 'Вдох') {
            // От 0.3 до 1.0
            scale = 0.3 + (localT * 0.7);
          } else if (currentPhase.name === 'Выдох') {
            // От 1.0 до 0.3
            scale = 1.0 - (localT * 0.7);
          } else if (currentPhase.name === 'Завершение') {
            // От 0.3 до 0.6
            scale = 0.3 + (localT * 0.3);
          }
          
          drawBreathCircle(scale, currentPhase.name);
        }
        
        // Обновляем прогресс-бар
        breathProgressBar.style.width = (progress * 100) + '%';
        
        breathAnimationFrame = requestAnimationFrame(animate);
      }
      
      breathAnimationFrame = requestAnimationFrame(animate);
    }, 50);
  }

  function stopBreathExercise(completed = false) {
    if (breathAnimationFrame) {
      cancelAnimationFrame(breathAnimationFrame);
      breathAnimationFrame = null;
    }
    
    if (breathCanvasCtx) {
      breathCanvasCtx.clearRect(0, 0, breathCanvasSize, breathCanvasSize);
    }
    
    if (completed) {
      setExerciseDone('breath');
    }
    
    breathExerciseContent.style.display = 'none';
    exerciseButtons.style.display = 'flex';
    breathProgressBar.style.width = '0%';
    breathPhase.textContent = '';
  }

  // Логика мини-разминки
  function showStretchExercise() {
    // Останавливаем другие упражнения
    if (eyeAnimationFrame) {
      stopEyeExercise(false);
    }
    if (breathAnimationFrame) {
      stopBreathExercise(false);
    }
    
    stretchExerciseContent.style.display = 'block';
    exerciseButtons.style.display = 'none';
    alreadyDoneToday.style.display = 'none';
    setExerciseDone('stretch');
  }

  function closeStretchExercise() {
    stretchExerciseContent.style.display = 'none';
    exerciseButtons.style.display = 'flex';
  }

  // Логика закрытия вкладки
  function closeTab() {
    try {
      window.close();
      // Если не получилось закрыть (например, вкладка не была открыта скриптом)
      setTimeout(() => {
        if (!document.hidden) {
          history.back();
        }
      }, 100);
    } catch {
      history.back();
    }
  }

  // Проверка выполненных упражнений при загрузке
  function checkExercisesDone() {
    const eyesDone = hasDoneExerciseToday('eyes');
    const breathDone = hasDoneExerciseToday('breath');
    const stretchDone = hasDoneExerciseToday('stretch');
    
    if (eyesDone || breathDone || stretchDone) {
      alreadyDoneToday.style.display = 'block';
    }
  }

  // Обработчики событий
  if (eyeExerciseBtn) {
    eyeExerciseBtn.addEventListener('click', startEyeExercise);
  }
  
  if (stopEyeExerciseBtn) {
    stopEyeExerciseBtn.addEventListener('click', () => stopEyeExercise(false));
  }
  
  if (breathExerciseBtn) {
    breathExerciseBtn.addEventListener('click', startBreathExercise);
  }
  
  if (stopBreathExerciseBtn) {
    stopBreathExerciseBtn.addEventListener('click', () => stopBreathExercise(false));
  }
  
  if (stretchExerciseBtn) {
    stretchExerciseBtn.addEventListener('click', showStretchExercise);
  }
  
  if (closeStretchExerciseBtn) {
    closeStretchExerciseBtn.addEventListener('click', closeStretchExercise);
  }
  
  if (closeTabBtn) {
    closeTabBtn.addEventListener('click', closeTab);
  }
  
  if (repeatAnywayBtn) {
    repeatAnywayBtn.addEventListener('click', () => {
      alreadyDoneToday.style.display = 'none';
    });
  }

  // Остановка анимаций при уходе со страницы
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (eyeAnimationFrame) {
        stopEyeExercise(false);
      }
      if (breathAnimationFrame) {
        stopBreathExercise(false);
      }
    }
  });

  // Обработка изменения размера окна для Canvas
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      if (eyeAnimationFrame && eyeExerciseContent.style.display !== 'none') {
        initEyeCanvas();
      }
      if (breathAnimationFrame && breathExerciseContent.style.display !== 'none') {
        initBreathCanvas();
      }
    }, 250);
  });

  // Инициализация при загрузке
  checkExercisesDone();
})();
