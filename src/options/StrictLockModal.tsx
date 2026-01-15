import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { TransactionChecker, TRON_BURN_ADDRESS } from '../shared/services/TransactionChecker'

interface StrictLockModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    requiredAmount?: number // in USDT, default 5
}

const StrictLockModal: React.FC<StrictLockModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    requiredAmount = 5
}) => {
    const [txId, setTxId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleVerify = async () => {
        if (!txId.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            // 1. Verify Transaction
            const result = await TransactionChecker.verifyPayment(txId.trim(), requiredAmount)

            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.message || 'Verification Failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md bg-gray-900 border border-red-500/30 rounded-xl shadow-2xl overflow-hidden text-white"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-red-500/20 bg-red-900/10">
                        <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                            <span className="text-2xl">🔒</span> Crypto Lock
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Strict Mode is active. You must pay a penalty to proceed.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Instruction */}
                        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                            <p className="text-sm text-gray-300 mb-2">
                                Send <strong className="text-white">{requiredAmount} USDT (TRC20)</strong> to the Burn Address below to unlock this action.
                            </p>

                            <div className="bg-gray-800 p-3 rounded font-mono text-xs text-center break-all text-yellow-500 select-all cursor-pointer hover:bg-gray-700 transition-colors"
                                onClick={() => navigator.clipboard.writeText(TRON_BURN_ADDRESS)}>
                                {TRON_BURN_ADDRESS}
                            </div>
                            <div className="text-center text-[10px] text-gray-500 mt-1">
                                (Click to copy)
                            </div>
                        </div>

                        {/* Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Transaction ID (Hash)
                            </label>
                            <input
                                type="text"
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                                placeholder="Paste TxID here..."
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white placeholder-gray-600 font-mono text-sm"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={isLoading || !txId}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all shadow-lg
                  ${isLoading || !txId
                                        ? 'bg-gray-700 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/20'}`}
                            >
                                {isLoading ? 'Verifying...' : 'Unlock'}
                            </button>
                        </div>

                        <p className="text-xs text-center text-gray-600">
                            Funds sent to the burn address are permanently destroyed.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default StrictLockModal
