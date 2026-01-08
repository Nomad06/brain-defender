/**
 * Schedule Configuration Modal
 * Allows setting up blocking schedules for sites
 */

import React, { useState } from 'react'
import { type Schedule, ScheduleMode } from '../shared/domain/schedule'

interface ScheduleModalProps {
  host: string
  initialSchedule?: Schedule | null
  onSave: (schedule: Schedule | null) => void
  onCancel: () => void
}

const DAYS = [
  { value: 0, label: 'Воскресенье', short: 'Вс' },
  { value: 1, label: 'Понедельник', short: 'Пн' },
  { value: 2, label: 'Вторник', short: 'Вт' },
  { value: 3, label: 'Среда', short: 'Ср' },
  { value: 4, label: 'Четверг', short: 'Чт' },
  { value: 5, label: 'Пятница', short: 'Пт' },
  { value: 6, label: 'Суббота', short: 'Сб' },
]

const ScheduleModal: React.FC<ScheduleModalProps> = ({ host, initialSchedule, onSave, onCancel }) => {
  const [mode, setMode] = useState<ScheduleMode>(initialSchedule?.mode || ScheduleMode.ALWAYS)
  const [workStart, setWorkStart] = useState(initialSchedule?.workHours?.start || '09:00')
  const [workEnd, setWorkEnd] = useState(initialSchedule?.workHours?.end || '18:00')
  const [customDays, setCustomDays] = useState<Set<number>>(
    new Set(initialSchedule?.customDays || [1, 2, 3, 4, 5])
  )
  const [customStart, setCustomStart] = useState(initialSchedule?.customTime?.start || '00:00')
  const [customEnd, setCustomEnd] = useState(initialSchedule?.customTime?.end || '23:59')

  const handleSave = () => {
    if (mode === ScheduleMode.ALWAYS) {
      onSave({ mode: ScheduleMode.ALWAYS })
    } else if (mode === ScheduleMode.VACATION) {
      onSave({ mode: ScheduleMode.VACATION })
    } else if (mode === ScheduleMode.WORK_HOURS) {
      onSave({
        mode: ScheduleMode.WORK_HOURS,
        workHours: {
          start: workStart,
          end: workEnd,
        },
      })
    } else if (mode === ScheduleMode.WEEKENDS) {
      onSave({ mode: ScheduleMode.WEEKENDS })
    } else if (mode === ScheduleMode.CUSTOM) {
      onSave({
        mode: ScheduleMode.CUSTOM,
        customDays: Array.from(customDays).sort(),
        customTime: {
          start: customStart,
          end: customEnd,
        },
      })
    }
  }

  const handleRemoveSchedule = () => {
    onSave(null)
  }

  const toggleDay = (day: number) => {
    const newDays = new Set(customDays)
    if (newDays.has(day)) {
      newDays.delete(day)
    } else {
      newDays.add(day)
    }
    setCustomDays(newDays)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h2" style={{ marginBottom: '8px' }}>
          Настройка расписания
        </div>
        <div className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
          {host}
        </div>

        {/* Mode selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Режим блокировки
          </label>
          <select
            className="input"
            value={mode}
            onChange={e => setMode(e.target.value as ScheduleMode)}
            style={{ width: '100%' }}
          >
            <option value={ScheduleMode.ALWAYS}>Всегда блокировать</option>
            <option value={ScheduleMode.WORK_HOURS}>Рабочие часы (Пн-Пт)</option>
            <option value={ScheduleMode.WEEKENDS}>Только выходные</option>
            <option value={ScheduleMode.CUSTOM}>Настраиваемое расписание</option>
            <option value={ScheduleMode.VACATION}>Не блокировать (каникулы)</option>
          </select>
        </div>

        {/* Work hours settings */}
        {mode === ScheduleMode.WORK_HOURS && (
          <div
            className="card"
            style={{ padding: '16px', background: 'var(--card2)', marginBottom: '20px' }}
          >
            <div className="h3" style={{ marginBottom: '12px', fontSize: '14px' }}>
              Рабочие часы (Понедельник - Пятница)
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Начало
                </label>
                <input
                  type="time"
                  className="input"
                  value={workStart}
                  onChange={e => setWorkStart(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ paddingTop: '20px' }}>—</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Конец
                </label>
                <input
                  type="time"
                  className="input"
                  value={workEnd}
                  onChange={e => setWorkEnd(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Custom schedule settings */}
        {mode === ScheduleMode.CUSTOM && (
          <div
            className="card"
            style={{ padding: '16px', background: 'var(--card2)', marginBottom: '20px' }}
          >
            <div className="h3" style={{ marginBottom: '12px', fontSize: '14px' }}>
              Дни недели
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {DAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  className={customDays.has(day.value) ? 'btn primary' : 'btn'}
                  onClick={() => toggleDay(day.value)}
                  style={{
                    flex: '1 1 auto',
                    minWidth: '45px',
                    padding: '8px 4px',
                    fontSize: '12px',
                  }}
                >
                  {day.short}
                </button>
              ))}
            </div>
            <div className="h3" style={{ marginBottom: '12px', fontSize: '14px' }}>
              Время
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Начало
                </label>
                <input
                  type="time"
                  className="input"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ paddingTop: '20px' }}>—</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Конец
                </label>
                <input
                  type="time"
                  className="input"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Info messages */}
        {mode === ScheduleMode.VACATION && (
          <div
            className="muted"
            style={{
              fontSize: '14px',
              padding: '12px',
              background: 'var(--card2)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            🏖️ Режим каникул: сайт не будет блокироваться
          </div>
        )}

        {mode === ScheduleMode.WEEKENDS && (
          <div
            className="muted"
            style={{
              fontSize: '14px',
              padding: '12px',
              background: 'var(--card2)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            📅 Блокировка только в субботу и воскресенье
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={onCancel} style={{ flex: 1 }}>
            Отмена
          </button>
          {initialSchedule && (
            <button className="btn danger" onClick={handleRemoveSchedule} style={{ flex: 1 }}>
              Удалить расписание
            </button>
          )}
          <button className="btn primary" onClick={handleSave} style={{ flex: 1 }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal
