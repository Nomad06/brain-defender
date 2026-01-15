
/**
 * Service to check TRC20 transactions via TronScan API
 * Used for "Strict Mode" verification
 */

interface TronScanTransaction {
    hash: string
    timestamp: number
    ownerAddress: string
    toAddress: string
    contractData: {
        amount: number
        tokenInfo: {
            tokenAbbr: string
        }
    }
    confirmed: boolean
}



// Tron Burn Address (Standard)
export const TRON_BURN_ADDRESS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'
// USDT TRC20 Contract
export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export class TransactionChecker {
    /**
     * Check a transaction on TronScan
     * @param txHash - Transaction Hash
     * @param minAmountUSDT - Minimum amount in USDT (default 5)
     * @param minTimestamp - Timestamp after which tx must have happened (ms)
     * @returns { success: boolean, message?: string }
     */
    static async verifyPayment(
        txHash: string,
        minAmountUSDT: number = 5,
        minTimestamp: number = 0
    ): Promise<{ success: boolean; message?: string }> {
        try {
            // 1. Fetch from TronScan
            const response = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`)

            if (!response.ok) {
                return { success: false, message: 'Could not connect to TronScan API' }
            }

            const txData = await response.json() as TronScanTransaction

            // 2. Validate existence
            if (!txData || !txData.hash) {
                return { success: false, message: 'Transaction not found' }
            }

            // 3. Validate Confirmation
            if (!txData.confirmed) {
                return { success: false, message: 'Transaction is not yet confirmed' }
            }

            // 4. Validate Receiver (Must be Burn Address)
            if (txData.toAddress !== TRON_BURN_ADDRESS) {
                // Sometimes internal transactions are tricky, but generally toAddress should be the burn address
                // or one of the transfer recipients. TronScan API structure might vary slightly for internal transfers.
                // For simple transfers TO the burn address, this usually works.
                // Let's being strict:
                return { success: false, message: `Receiver must be ${TRON_BURN_ADDRESS}` }
            }

            // 5. Validate Token (Must be USDT)
            // Note: TronScan API response structure for token transfers involves 'contractData' usually or 'transfers' array
            // Simplification: We check if it's a TRC20 transfer.
            // Actually, 'contractData' usually holds the transfer info for triggerSmartContract
            if (txData.contractData?.tokenInfo?.tokenAbbr !== 'USDT') {
                return { success: false, message: 'Transaction must be in USDT (TRC20)' }
            }

            // 6. Validate Amount
            // USDT has 6 decimals.
            const amount = txData.contractData.amount
            const requiredAmount = minAmountUSDT * 1000000

            if (amount < requiredAmount) {
                return { success: false, message: `Amount ${amount / 1000000} USDT is less than required ${minAmountUSDT} USDT` }
            }

            // 7. Validate Timestamp
            if (txData.timestamp < minTimestamp) {
                return { success: false, message: 'Transaction is too old' }
            }

            return { success: true }

        } catch (e) {
            console.error('Transaction Verification Error:', e)
            return { success: false, message: 'Error verifying transaction' }
        }
    }
}
