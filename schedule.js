// Система расписания блокировок

// Режимы блокировки
const SCHEDULE_MODES = {
  ALWAYS: 'always',
  WORK_HOURS: 'workHours',
  WEEKENDS: 'weekends',
  CUSTOM: 'custom',
  PER_DAY: 'perDay', // Разные расписания для разных дней недели
  VACATION: 'vacation' // Режим каникул (все блокировки отключены)
};

// Проверка, активна ли блокировка сейчас
function isScheduleActive(schedule) {
  if (!schedule || !schedule.mode) {
    return true; // По умолчанию всегда блокируем
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ...
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // минуты с начала дня
  
  switch (schedule.mode) {
    case SCHEDULE_MODES.ALWAYS:
      return true;
    
    case SCHEDULE_MODES.VACATION:
      // Режим каникул - все блокировки отключены
      return false;
      
    case SCHEDULE_MODES.WORK_HOURS:
      // Блокируем в рабочие дни (понедельник-пятница) с 9:00 до 18:00
      const workStart = schedule.workHours?.start ? parseTime(schedule.workHours.start) : 9 * 60; // 9:00
      const workEnd = schedule.workHours?.end ? parseTime(schedule.workHours.end) : 18 * 60; // 18:00
      const isWorkDay = currentDay >= 1 && currentDay <= 5; // Пн-Пт
      return isWorkDay && currentTime >= workStart && currentTime < workEnd;
      
    case SCHEDULE_MODES.WEEKENDS:
      // Блокируем только в выходные (суббота и воскресенье)
      return currentDay === 0 || currentDay === 6;
      
    case SCHEDULE_MODES.CUSTOM:
      // Кастомное расписание
      if (!schedule.customDays || !Array.isArray(schedule.customDays)) {
        return true; // Если не настроено, блокируем всегда
      }
      
      const customStart = schedule.customTime?.start ? parseTime(schedule.customTime.start) : 0;
      const customEnd = schedule.customTime?.end ? parseTime(schedule.customTime.end) : 24 * 60;
      
      // Проверяем, входит ли текущий день в список дней
      const isCustomDay = schedule.customDays.includes(currentDay);
      const isCustomTime = currentTime >= customStart && currentTime < customEnd;
      
      return isCustomDay && isCustomTime;
    
    case SCHEDULE_MODES.PER_DAY:
      // Разные расписания для разных дней недели
      if (!schedule.perDay || !schedule.perDay[currentDay]) {
        return true; // Если для этого дня не настроено, блокируем всегда
      }
      
      const daySchedule = schedule.perDay[currentDay];
      if (daySchedule.mode === SCHEDULE_MODES.VACATION || daySchedule.mode === 'vacation') {
        return false; // Каникулы для этого дня
      }
      
      if (daySchedule.mode === SCHEDULE_MODES.ALWAYS || daySchedule.mode === 'always') {
        return true; // Всегда блокируем в этот день
      }
      
      // Проверяем время для этого дня
      if (daySchedule.timeRange) {
        const dayStart = parseTime(daySchedule.timeRange.start || '00:00');
        const dayEnd = parseTime(daySchedule.timeRange.end || '23:59');
        return currentTime >= dayStart && currentTime < dayEnd;
      }
      
      return true; // По умолчанию блокируем
      
    default:
      return true;
  }
}

// Парсинг времени из строки "HH:MM" в минуты с начала дня
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

// Форматирование времени из минут в "HH:MM"
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Создание расписания по умолчанию
function createDefaultSchedule() {
  return {
    mode: SCHEDULE_MODES.ALWAYS,
    workHours: {
      start: '09:00',
      end: '18:00'
    },
    customDays: [],
    customTime: {
      start: '09:00',
      end: '18:00'
    },
    perDay: null, // Для режима perDay
    vacationUntil: null // Дата окончания каникул (timestamp)
  };
}

// Создание шаблона расписания
function createScheduleTemplate(templateName) {
  const templates = {
    workdays: {
      mode: SCHEDULE_MODES.WORK_HOURS,
      workHours: {
        start: '09:00',
        end: '18:00'
      }
    },
    weekends: {
      mode: SCHEDULE_MODES.WEEKENDS
    },
    perDayWork: {
      mode: SCHEDULE_MODES.PER_DAY,
      perDay: {
        1: { mode: SCHEDULE_MODES.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Понедельник
        2: { mode: SCHEDULE_MODES.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Вторник
        3: { mode: SCHEDULE_MODES.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Среда
        4: { mode: SCHEDULE_MODES.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Четверг
        5: { mode: SCHEDULE_MODES.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Пятница
        6: { mode: SCHEDULE_MODES.VACATION }, // Суббота
        0: { mode: SCHEDULE_MODES.VACATION }  // Воскресенье
      }
    },
    vacation: {
      mode: SCHEDULE_MODES.VACATION,
      vacationUntil: null // null = бессрочно, или timestamp
    }
  };
  
  return templates[templateName] || createDefaultSchedule();
}

// Получение списка доступных шаблонов
function getScheduleTemplates() {
  return {
    workdays: {
      name: 'Рабочие дни',
      description: 'Блокировка в рабочие дни с 9:00 до 18:00'
    },
    weekends: {
      name: 'Выходные',
      description: 'Блокировка только в выходные дни'
    },
    perDayWork: {
      name: 'Рабочая неделя',
      description: 'Блокировка в будни с 9:00 до 18:00, свободные выходные'
    },
    vacation: {
      name: 'Каникулы',
      description: 'Все блокировки отключены'
    }
  };
}

// Валидация расписания
function validateSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return { valid: false, error: 'Schedule must be an object' };
  }
  
  if (!schedule.mode || !Object.values(SCHEDULE_MODES).includes(schedule.mode)) {
    return { valid: false, error: 'Invalid schedule mode' };
  }
  
  if (schedule.mode === SCHEDULE_MODES.WORK_HOURS && schedule.workHours) {
    const start = parseTime(schedule.workHours.start);
    const end = parseTime(schedule.workHours.end);
    if (start >= end) {
      return { valid: false, error: 'Work hours: start time must be before end time' };
    }
  }
  
  if (schedule.mode === SCHEDULE_MODES.CUSTOM) {
    if (!Array.isArray(schedule.customDays)) {
      return { valid: false, error: 'Custom days must be an array' };
    }
    if (schedule.customDays.some(day => day < 0 || day > 6)) {
      return { valid: false, error: 'Custom days must be between 0 and 6' };
    }
    if (schedule.customTime) {
      const start = parseTime(schedule.customTime.start);
      const end = parseTime(schedule.customTime.end);
      if (start >= end) {
        return { valid: false, error: 'Custom time: start time must be before end time' };
      }
    }
  }
  
  return { valid: true };
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
  window.schedule = {
    SCHEDULE_MODES,
    isScheduleActive,
    parseTime,
    formatTime,
    createDefaultSchedule,
    createScheduleTemplate,
    getScheduleTemplates,
    validateSchedule
  };
}

