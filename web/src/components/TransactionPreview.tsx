/**
 * Transaction Preview Modal
 * Shows users exactly what they're signing before they sign it
 * Critical for security and user trust
 */

interface TransactionPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  transaction: {
    type: string
    amount: string
    recipient: string
    chainId: number
    estimatedGas?: string
  }
}

export function TransactionPreview({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transaction 
}: TransactionPreviewProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Confirm Transaction</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Please review carefully before signing
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium text-gray-900">{transaction.type}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-gray-900">Ξ {transaction.amount}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Contract:</span>
            <span className="font-mono text-xs text-gray-900 break-all">
              {transaction.recipient}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Network:</span>
            <span className="font-medium text-gray-900">
              {transaction.chainId === 8453 ? 'Base' : 
               transaction.chainId === 84532 ? 'Base Sepolia' : 
               `Chain ${transaction.chainId}`}
            </span>
          </div>

          {transaction.estimatedGas && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Est. Gas:</span>
              <span className="font-medium text-gray-900">
                ~{transaction.estimatedGas} ETH
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Sign Transaction
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          This will open your wallet for signing
        </p>
      </div>
    </div>
  )
}
