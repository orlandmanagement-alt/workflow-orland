// @ts-nocheck
/**
 * Signature Pad Component
 * Canvas-based signature capture for contract signing
 */

import React, { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
  width?: number
  height?: number
  onSignatureCapture: (imageData: string) => void
  disabled?: boolean
  placeholder?: string
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  width = 500,
  height = 200,
  onSignatureCapture,
  disabled = false,
  placeholder = 'Sign here',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set up canvas
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [width, height])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      setIsDrawing(true)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
      setIsEmpty(false)
    }
  }

  const endDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setIsEmpty(true)
    }
  }

  const captureSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) {
      alert('Please sign before submitting')
      return
    }

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/png')
    onSignatureCapture(imageData)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Signature
        </label>
        {!isEmpty && (
          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled}
            className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
          >
            Clear
          </button>
        )}
      </div>

      {/* Canvas for signature */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={(e) => {
            if (disabled) return
            const touch = e.touches[0]
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.beginPath()
              ctx.moveTo(x, y)
              setIsDrawing(true)
            }
          }}
          onTouchMove={(e) => {
            if (!isDrawing || disabled) return
            const touch = e.touches[0]
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.lineTo(x, y)
              ctx.stroke()
              setIsEmpty(false)
            }
          }}
          onTouchEnd={endDrawing}
          disabled={disabled}
          className={`w-full cursor-${disabled ? 'not-allowed' : 'crosshair'} block`}
          style={{ minHeight: '200px', display: 'block' }}
        />
      </div>

      {isEmpty && (
        <p className="text-sm text-gray-500 text-center py-2">
          {placeholder}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || isEmpty}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={captureSignature}
          disabled={disabled || isEmpty}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Confirm Signature
        </button>
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500 text-center">
        By signing, you agree to the contract terms and conditions
      </p>
    </div>
  )
}

export default SignaturePad
