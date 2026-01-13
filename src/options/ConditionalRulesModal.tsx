/**
 * Conditional Rules Modal Component
 * Allows users to configure conditional blocking rules for a site
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        alert(t('conditionalRules.validationError', { error: validation.error || 'Unknown error' }))
        return
      }
    }

    onSave(rules)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-sumi-black">{t('conditionalRules.modalTitle')}</h2>
            <div className="text-xs text-sumi-gray mt-1 font-mono">
              {host}
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/5 text-sumi-gray transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-sm text-sumi-gray mb-6 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100">
            {t('conditionalRules.description')}
          </div>

          {/* Existing Rules */}
          {rules.length > 0 && (
            <div className="space-y-3 mb-6">
              <AnimatePresence>
                {rules.map((rule, index) => (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    key={index}
                    className={`rounded-lg border border-border overflow-hidden transition-all ${rule.enabled ? 'bg-white shadow-sm' : 'bg-gray-50 opacity-70'
                      }`}
                  >
                    <div className="p-4 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1 text-sumi-black flex items-center gap-2">
                          <span>{conditionTypes.find(t => t.type === rule.type)?.icon}</span>
                          {conditionTypes.find(t => t.type === rule.type)?.name}
                        </div>
                        <div className="text-xs text-sumi-gray">
                          {getConditionDescription(rule)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 rounded text-xs border border-border hover:bg-gray-100 transition-colors"
                          onClick={() => handleToggleRule(index)}
                        >
                          {rule.enabled ? '⏸' : '▶️'}
                        </button>
                        <button
                          className="p-1.5 rounded text-xs border border-danger text-danger hover:bg-danger hover:text-white transition-colors"
                          onClick={() => handleRemoveRule(index)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Rule Configuration */}
                    {rule.enabled && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="pt-3 mt-1 border-t border-border/50">
                          {rule.type === ConditionType.VISITS_PER_DAY && (
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-sumi-black font-medium">
                                {t('conditionalRules.maxVisitsPerDay')}
                              </label>
                              <input
                                type="number"
                                className="w-24 px-2 py-1 text-sm rounded border border-border bg-white focus:border-accent outline-none"
                                min="1"
                                value={rule.maxVisits || 5}
                                onChange={e =>
                                  handleUpdateRule(index, { maxVisits: parseInt(e.target.value) || 5 })
                                }
                              />
                            </div>
                          )}

                          {rule.type === ConditionType.TIME_LIMIT && (
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-sumi-black font-medium">
                                {t('conditionalRules.maxTimeMinutesLabel')}
                              </label>
                              <input
                                type="number"
                                className="w-24 px-2 py-1 text-sm rounded border border-border bg-white focus:border-accent outline-none"
                                min="1"
                                value={rule.maxTimeMinutes || 30}
                                onChange={e =>
                                  handleUpdateRule(index, { maxTimeMinutes: parseInt(e.target.value) || 30 })
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add Rule Buttons */}
          <div className="bg-gray-50 p-4 rounded-lg border border-border">
            <label className="block mb-3 font-semibold text-xs uppercase tracking-wider text-sumi-gray">
              {t('conditionalRules.addCondition')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {conditionTypes.map(type => (
                <button
                  key={type.type}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border text-xs font-medium hover:border-accent hover:text-accent transition-all shadow-sm"
                  onClick={() => handleAddRule(type.type)}
                  title={type.description}
                >
                  <span className="text-base">{type.icon}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 border-t border-border bg-gray-50/50 flex gap-3">
          <button
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-sumi-gray hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white hover:bg-opacity-90 transition-colors shadow-sm font-medium"
            onClick={handleSave}
          >
            {t('common.save')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ConditionalRulesModal
