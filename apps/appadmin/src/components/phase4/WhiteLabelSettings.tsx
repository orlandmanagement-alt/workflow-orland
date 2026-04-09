/**
 * White-Label Settings Component
 * Agency branding configuration
 */

import React, { useState, useRef } from 'react'
import { Settings, Loader2, AlertCircle, Check, Upload, Palette } from 'lucide-react'
import { useWhiteLabel } from '../../hooks/usePhase4'

export const WhiteLabelSettings: React.FC = () => {
  const { config, loading, update, uploadWatermark } = useWhiteLabel()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null)
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    customDomain: config?.custom_domain || '',
    primaryColor: config?.primary_color || '#3b82f6',
    secondaryColor: config?.secondary_color || '#1e40af',
    logoUrl: config?.logo_url || '',
    whitelabelEnabled: config?.white_label_enabled || false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleWatermarkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setWatermarkFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setWatermarkPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadWatermark = async () => {
    if (!watermarkFile) return

    setIsSubmitting(true)
    setError(null)
    const success = await uploadWatermark(watermarkFile)

    if (success) {
      setWatermarkFile(null)
      setWatermarkPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.customDomain && !isValidDomain(form.customDomain)) {
      setError('Invalid domain format')
      return
    }

    setIsSubmitting(true)
    const success = await update({
      custom_domain: form.customDomain,
      primary_color: form.primaryColor,
      secondary_color: form.secondaryColor,
      logo_url: form.logoUrl,
      white_label_enabled: form.whitelabelEnabled,
    })

    if (success) {
      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setIsSubmitting(false)
  }

  const isValidDomain = (domain: string) => {
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain)
  }

  if (loading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">White-Label Settings</h2>
        </div>
        <p className="text-gray-600">Customize your agency branding and domain</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Changes saved successfully!</p>
            <p className="text-green-800 text-sm">Your white-label settings have been updated.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable White-Label */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Enable White-Labeling</h3>
              <p className="text-sm text-gray-600 mt-1">
                Allow clients to access your talent roster through a custom domain
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="whitelabelEnabled"
                checked={form.whitelabelEnabled}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-6 h-6"
              />
            </label>
          </div>
        </div>

        {form.whitelabelEnabled && (
          <>
            {/* Custom Domain */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h3 className="font-semibold text-gray-900">Custom Domain</h3>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Domain Name
                </label>
                <input
                  type="text"
                  name="customDomain"
                  value={form.customDomain}
                  onChange={handleInputChange}
                  placeholder="talents.youragency.com"
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Configure your DNS CNAME record to point to api.orlandmanagement.com
                </p>
              </div>
            </div>

            {/* Branding Colors */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="primaryColor"
                      value={form.primaryColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={form.secondaryColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={form.secondaryColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: form.primaryColor }}>
                  <p className="text-white text-sm font-semibold">Primary Color Preview</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: form.secondaryColor }}>
                  <p className="text-white text-sm font-semibold">Secondary Color Preview</p>
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h3 className="font-semibold text-gray-900">Logo URL</h3>
              <input
                type="url"
                name="logoUrl"
                value={form.logoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/logo.png"
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
              />
              {form.logoUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                  <img src={form.logoUrl} alt="Logo" className="max-h-12 max-w-xs" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Edit Settings
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setForm({
                    customDomain: config?.custom_domain || '',
                    primaryColor: config?.primary_color || '#3b82f6',
                    secondaryColor: config?.secondary_color || '#1e40af',
                    logoUrl: config?.logo_url || '',
                    whitelabelEnabled: config?.white_label_enabled || false,
                  })
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>

      {/* Watermark Section */}
      {config?.white_label_enabled && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-gray-900">Watermark</h3>
          <p className="text-sm text-gray-600">
            Add a watermark to all profile photos displayed on your custom domain
          </p>

          {config?.watermark_url && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Current Watermark:</p>
              <img src={config.watermark_url} alt="Watermark" className="max-h-24 max-w-xs" />
            </div>
          )}

          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleWatermarkSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Upload className="w-5 h-5" />
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-2">PNG, JPEG, GIF, WebP (max 5MB)</p>
            </div>

            {watermarkPreview && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img src={watermarkPreview} alt="Preview" className="max-h-24 max-w-xs" />
                <button
                  onClick={handleUploadWatermark}
                  disabled={isSubmitting}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Watermark'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WhiteLabelSettings
