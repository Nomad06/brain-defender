/**
 * Schedule Configuration Modal
 * Allows setting up blocking schedules for sites
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { type Schedule, ScheduleMode } from '../shared/domain/schedule'
import { t } from '../shared/i18n'
import { ZenSelect } from './components/ZenSelect'

interface ScheduleModalProps {
  host: string
  initialSchedule?: Schedule | null
  onSave: (schedule: Schedule | null) => void
  onCancel: () => void
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ host, initialSchedule, onSave, onCancel }) => {
  const [mode, setMode] = useState<ScheduleMode>(initialSchedule?.mode || ScheduleMode.ALWAYS)
  const [workStart, setWorkStart] = useState(initialSchedule?.workHours?.start || '09:00')
  const [workEnd, setWorkEnd] = useState(initialSchedule?.workHours?.end || '18:00')
  const [customDays, setCustomDays] = useState<Set<number>>(
    new Set(initialSchedule?.customDays || [1, 2, 3, 4, 5])
  )
  const [customStart, setCustomStart] = useState(initialSchedule?.customTime?.start || '00:00')
  const [customEnd, setCustomEnd] = useState(initialSchedule?.customTime?.end || '23:59')

  const DAYS = [
    { value: 0, label: t('schedule.sunday'), short: t('schedule.sunday') },
    { value: 1, label: t('schedule.monday'), short: t('schedule.monday') },
    { value: 2, label: t('schedule.tuesday'), short: t('schedule.tuesday') },
    { value: 3, label: t('schedule.wednesday'), short: t('schedule.wednesday') },
    { value: 4, label: t('schedule.thursday'), short: t('schedule.thursday') },
    { value: 5, label: t('schedule.friday'), short: t('schedule.friday') },
    { value: 6, label: t('schedule.saturday'), short: t('schedule.saturday') },
  ]

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gray-50/50">
          <h2 className="text-xl font-semibold text-sumi-black">
            {t('schedule.modalTitle', { host })}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Mode selector */}

          <ZenSelect
            label={t('schedule.scheduleMode')}
            value={mode}
            onChange={(val) => setMode(val as ScheduleMode)}
            options={[
              { value: ScheduleMode.ALWAYS, label: t('schedule.alwaysBlock') },
              { value: ScheduleMode.WORK_HOURS, label: t('schedule.workHours') },
              { value: ScheduleMode.WEEKENDS, label: t('schedule.weekendsOnly') },
              { value: ScheduleMode.CUSTOM, label: t('schedule.customSchedule') },
              { value: ScheduleMode.VACATION, label: t('schedule.vacation') },
            ]}
          />

          {/* Work hours settings */}
          {mode === ScheduleMode.WORK_HOURS && (
            <div className="bg-gray-50 p-4 rounded-lg border border-border mb-6">
              <h3 className="text-sm font-medium mb-3 text-sumi-black">
                {t('schedule.workHoursLabel')}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-sumi-gray mb-1">
                    {t('schedule.from')}
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-border bg-white focus:border-accent outline-none"
                    value={workStart}
                    onChange={e => setWorkStart(e.target.value)}
                  />
                </div>
                <div className="pt-5 text-sumi-gray">—</div>
                <div className="flex-1">
                  <label className="block text-xs text-sumi-gray mb-1">
                    {t('schedule.to')}
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-border bg-white focus:border-accent outline-none"
                    value={workEnd}
                    onChange={e => setWorkEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom schedule settings */}
          {mode === ScheduleMode.CUSTOM && (
            <div className="bg-gray-50 p-4 rounded-lg border border-border mb-6">
              <h3 className="text-sm font-medium mb-3 text-sumi-black">
                {t('schedule.customDaysLabel')}
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`flex-1 min-w-[40px] py-2 px-1 text-xs rounded transition-colors ${customDays.has(day.value)
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-white border border-border text-sumi-gray hover:bg-gray-100'
                      }`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              <h3 className="text-sm font-medium mb-3 text-sumi-black">
                {t('schedule.customTimeLabel')}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-sumi-gray mb-1">
                    {t('schedule.from')}
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-border bg-white focus:border-accent outline-none"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="pt-5 text-sumi-gray">—</div>
                <div className="flex-1">
                  <label className="block text-xs text-sumi-gray mb-1">
                    {t('schedule.to')}
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-border bg-white focus:border-accent outline-none"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info messages */}
          {mode === ScheduleMode.VACATION && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 mb-6 text-sm">
              {t('schedule.vacationDescription')}
            </div>
          )}

          {mode === ScheduleMode.WEEKENDS && (
            <div className="bg-gray-50 text-sumi-gray p-4 rounded-lg border border-border mb-6 text-sm">
              {t('schedule.weekendsDescription')}
            </div>
          )}

          {mode === ScheduleMode.WORK_HOURS && (
            <div className="bg-gray-50 text-sumi-gray p-4 rounded-lg border border-border mb-6 text-sm">
              {t('schedule.workHoursDescription', { start: workStart, end: workEnd })}
            </div>
          )}

          {mode === ScheduleMode.CUSTOM && (
            <div className="bg-gray-50 text-sumi-gray p-4 rounded-lg border border-border mb-6 text-sm">
              {t('schedule.customDescription', { start: customStart, end: customEnd })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-6 border-t border-border bg-gray-50/50 flex gap-3">
          <button
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-sumi-gray hover:bg-gray-50 transition-colors"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
          {initialSchedule && (
            <button
              className="flex-1 px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors"
              onClick={handleRemoveSchedule}
            >
              {t('schedule.removeSchedule')}
            </button>
          )}
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white hover:bg-opacity-90 transition-colors shadow-sm"
            onClick={handleSave}
          >
            {t('common.save')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ScheduleModal
