/**
 * Conditional Rules Modal Component
 * Allows users to configure conditional blocking rules for a site
 */

import React, { useState } from 'react'
import { t } from '../shared/i18n'
import {
  type ConditionalRule,
  ConditionType,
  createDefaultRule,
  getConditionDescription,
  getConditionTypes,
  validateConditionalRule,
} from '../shared/domain/conditional-rules'

interface ConditionalRulesModalProps {
  host: string
  initialRules: ConditionalRule[]
  onClose: () => void
  onSave: (rules: ConditionalRule[]) => void
}

const ConditionalRulesModal: React.FC<ConditionalRulesModalProps> = ({
  host,
  initialRules,
  onClose,
  onSave,
}) => {
  const [rules, setRules] = useState<ConditionalRule[]>(initialRules || [])

  const conditionTypes = getConditionTypes()

  const handleAddRule = (type: ConditionType) => {
    const newRule = createDefaultRule(type)
    setRules([...rules, newRule])
  }

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    setRules(newRules)
  }

  const handleToggleRule = (index: number) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], enabled: !newRules[index].enabled }
    setRules(newRules)
  }

  const handleUpdateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updates }
    setRules(newRules)
  }

  const handleSave = () => {
    // Validate all rules
    for (const rule of rules) {
      const validation = validateConditionalRule(rule)
      if (!validation.valid) {
        alert(`Ошибка валидации: ${validation.error}`)
        return
      }
    }

    onSave(rules)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          margin: '20px',
          padding: '20px',
          background: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <div className="h2">Условия блокировки</div>
            <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              {host}
            </div>
          </div>
          <button
            className="btn"
            onClick={onClose}
            style={{ padding: '4px 8px', fontSize: '18px', minWidth: 'auto' }}
          >
            ✕
          </button>
        </div>

        <div className="muted" style={{ marginBottom: '16px', fontSize: '12px' }}>
          Настройте условия, при которых сайт будет блокироваться. Если ни одно условие не выполнено,
          сайт будет доступен.
        </div>

        {/* Existing Rules */}
        {rules.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {rules.map((rule, index) => (
              <div
                key={index}
                className="card"
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: rule.enabled ? 'var(--card2)' : 'var(--card)',
                  opacity: rule.enabled ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', fontSize: '13px' }}>
                      {conditionTypes.find(t => t.type === rule.type)?.icon}{' '}
                      {conditionTypes.find(t => t.type === rule.type)?.name}
                    </div>
                    <div className="muted" style={{ fontSize: '11px' }}>
                      {getConditionDescription(rule)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn"
                      onClick={() => handleToggleRule(index)}
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                    >
                      {rule.enabled ? '⏸' : '▶️'}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => handleRemoveRule(index)}
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Rule Configuration */}
                {rule.enabled && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    {rule.type === ConditionType.VISITS_PER_DAY && (
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Максимум посещений в день:
                        </label>
                        <input
                          type="number"
                          className="input"
                          min="1"
                          value={rule.maxVisits || 5}
                          onChange={e =>
                            handleUpdateRule(index, { maxVisits: parseInt(e.target.value) || 5 })
                          }
                          style={{ width: '100px', fontSize: '12px' }}
                        />
                      </div>
                    )}

                    {rule.type === ConditionType.TIME_AFTER && (
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Блокировать после:
                        </label>
                        <input
                          type="time"
                          className="input"
                          value={rule.timeAfter || '18:00'}
                          onChange={e => handleUpdateRule(index, { timeAfter: e.target.value })}
                          style={{ width: '120px', fontSize: '12px' }}
                        />
                      </div>
                    )}

                    {rule.type === ConditionType.DAYS_OF_WEEK && (
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                          Дни недели:
                        </label>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {[
                            { value: 1, label: 'Пн' },
                            { value: 2, label: 'Вт' },
                            { value: 3, label: 'Ср' },
                            { value: 4, label: 'Чт' },
                            { value: 5, label: 'Пт' },
                            { value: 6, label: 'Сб' },
                            { value: 0, label: 'Вс' },
                          ].map(day => (
                            <label
                              key={day.value}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                background: (rule.days || []).includes(day.value)
                                  ? 'var(--primary)'
                                  : 'var(--card)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                userSelect: 'none',
                                color: (rule.days || []).includes(day.value) ? 'white' : 'inherit',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={(rule.days || []).includes(day.value)}
                                onChange={e => {
                                  const currentDays = rule.days || []
                                  const newDays = e.target.checked
                                    ? [...currentDays, day.value]
                                    : currentDays.filter(d => d !== day.value)
                                  handleUpdateRule(index, { days: newDays })
                                }}
                                style={{ display: 'none' }}
                              />
                              {day.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {rule.type === ConditionType.TIME_LIMIT && (
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Максимум минут в день:
                        </label>
                        <input
                          type="number"
                          className="input"
                          min="1"
                          value={rule.maxTimeMinutes || 30}
                          onChange={e =>
                            handleUpdateRule(index, { maxTimeMinutes: parseInt(e.target.value) || 30 })
                          }
                          style={{ width: '100px', fontSize: '12px' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Rule Buttons */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '12px' }}>
            Добавить условие:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {conditionTypes.map(type => (
              <button
                key={type.type}
                className="btn"
                onClick={() => handleAddRule(type.type)}
                style={{ fontSize: '11px', padding: '6px 10px' }}
                title={type.description}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>
            {t('common.cancel')}
          </button>
          <button className="btn primary" onClick={handleSave} style={{ flex: 1 }}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConditionalRulesModal
