/**
 * Contract Signing Component
 * Allows users to capture digital signatures via canvas
 */

import React, { useRef, useState, useCallback } from 'react'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'

interface ContractSigningProps {
  contractId: string
  talentName?: string
  clientName?: string
  contractAmount?: number
  signerType: 'talent' | 'client'
  onSignatureComplete?: (signatureData: string) => void
  isLoading?: boolean
  error?: string | null
}

export const ContractSigning: React.FC<ContractSigningProps> = ({
  contractId,
  talentName = 'Talent',
  clientName = 'Client',
  contractAmount,
  signerType,
  onSignatureComplete,
  isLoading = false,
  error = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [canClear, setCanClear] = useState(false)

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(2, 2)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!canClear) setCanClear(true)

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx?.beginPath()
    ctx?.moveTo(
      (e.clientX - rect.left) * 2,
      (e.clientY - rect.top) * 2
    )

    setIsDrawing(true)
  }

  // Draw on canvas
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx?.lineTo(
      (e.clientX - rect.left) * 2,
      (e.clientY - rect.top) * 2
    )
    ctx?.stroke()
  }

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Clear signature
  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    setSignature(null)
    setCanClear(false)
  }

  // Submit signature
  const submitSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL('image/png')
    setSignature(signatureData)

    if (onSignatureComplete) {
      onSignatureComplete(signatureData)
    }
  }

  React.useEffect(() => {
    initializeCanvas()
    window.addEventListener('resize', initializeCanvas)
    return () => window.removeEventListener('resize', initializeCanvas)
  }, [initializeCanvas])

  const signerLabel = signerType === 'talent' ? talentName : clientName
  const otherParty = signerType === 'talent' ? clientName : talentName

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Contract Esignature</h2>
      <p className="text-gray-600 mb-6">
        Please review and sign the contract below
      </p>

      {/* Contract Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Contract ID</p>
            <p className="font-mono text-gray-900">{contractId.substring(0, 12)}...</p>
          </div>
          <div>
            <p className="text-gray-600">Amount</p>
            {contractAmount && (
              <p className="font-semibold text-gray-900">
                IDR {contractAmount.toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-600">Signing as</p>
            <p className="font-semibold text-gray-900">{signerLabel}</p>
          </div>
          <div>
            <p className="text-gray-600">Counterparty</p>
            <p className="font-semibold text-gray-900">{otherParty}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Signature Canvas */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          Your Signature
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair"
            style={{ minHeight: '200px' }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Draw your signature in the box above
        </p>
      </div>

      {/* Legal Notice */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Legal Notice</p>
          <p className="mt-1">
            By signing this contract, you agree to all terms and conditions. This signature 
            will be legally binding and recorded with a timestamp. Both parties must sign 
            before payment proceeds.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canClear && (
          <button
            onClick={clearSignature}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
        )}

        <button
          onClick={submitSignature}
          disabled={isLoading || !canClear}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing...
            </>
          ) : signature ? (
            <>
              <Check className="w-5 h-5" />
              Signed
            </>
          ) : (
            'Sign Contract'
          )}
        </button>
      </div>

      {/* Confirmation */}
      {signature && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900">
            ✓ Your signature has been captured. Waiting for {otherParty} to sign...
          </p>
        </div>
      )}
    </div>
  )
}

export default ContractSigning
